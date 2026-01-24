import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { GHNService } from './ghn.service';

/**
 * =====================================================================
 * SHIPPING CRON SERVICE - ĐỒNG BỘ TRẠNG THÁI VẬN CHUYỂN TỰ ĐỘNG
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class ShippingCronService {
  private readonly logger = new Logger(ShippingCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ghnService: GHNService,
  ) {}

  // ✅ TỐI ƯU: Chuyển sang chạy 30 phút/lần thay vì 1 phút/lần
  // Cron job chỉ nên đóng vai trò "Backup" để vét các đơn bị lọt Webhook
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Starting backup shipping status sync (Cron Job)...');

    // Tìm các đơn đang vận chuyển NHƯNG đã lâu không được cập nhật ( > 30 phút)
    // Điều này giúp tránh conflict với Webhook và tránh spam API GHN
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.SHIPPED, OrderStatus.PROCESSING],
        },
        shippingCode: {
          not: null,
        },
        updatedAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000), // Đã > 30 phút chưa có tương tác gì
        },
      },
      take: 20, // Giảm số lượng mỗi lần quét để tránh overload
      orderBy: {
        updatedAt: 'asc', // Ưu tiên xử lý đơn lâu nhất trước (FIFO)
      },
    });

    if (orders.length === 0) {
      // this.logger.log('No stale orders found to sync.');
      return;
    }

    this.logger.log(`Found ${orders.length} stale orders to sync status.`);

    for (const order of orders) {
      if (!order.shippingCode) continue;

      try {
        const detail = await this.ghnService.getOrderDetail(order.shippingCode);

        // Update updatedAt kể cả khi status không đổi để lần quét sau (30p nữa) mới quét lại đơn này
        // Tránh việc cứ mỗi lần chạy lại query đúng đơn này mãi nếu GHN không đổi status
        let shouldUpdateTimestamp = true;

        if (detail) {
          const ghnStatus = detail.status.toLowerCase();
          let newStatus: OrderStatus | null = null;

          if (
            ['picked', 'delivering', 'money_collect_delivering'].includes(
              ghnStatus,
            )
          ) {
            newStatus = OrderStatus.SHIPPED;
          } else if (ghnStatus === 'delivered') {
            newStatus = OrderStatus.DELIVERED;
          } else if (ghnStatus === 'cancel') {
            newStatus = OrderStatus.CANCELLED;
          } else if (['return', 'returned'].includes(ghnStatus)) {
            newStatus = OrderStatus.RETURNED;
          }

          if (newStatus && newStatus !== order.status) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                status: newStatus,
                ghnStatus: ghnStatus,
              },
            });
            this.logger.log(
              `Updated order ${order.id} to ${newStatus} (GHN: ${ghnStatus})`,
            );
            shouldUpdateTimestamp = false; // Đã update rồi thì timestamp tự nhảy
          }
        }

        // Nếu không có status mới, ta vẫn "touch" vào đơn hàng để update `updatedAt`
        // Mục đích: Đẩy đơn này xuống cuối hàng đợi, nhường chỗ cho đơn khác trong lần quét tới
        if (shouldUpdateTimestamp) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { updatedAt: new Date() },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to sync order ${order.id}: ${error.message}`);
      }
    }
  }
}
