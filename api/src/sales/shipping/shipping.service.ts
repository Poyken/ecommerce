import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
}

export interface Ward {
  WardCode: string;
  WardName: string;
}

import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { GHNService } from './ghn.service';

/**
 * =====================================================================
 * SHIPPING SERVICE - QUẢN LÝ VẬN CHUYỂN & GIAO VẬN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ĐƠN VỊ VẬN CHUYỂN (GHN):
 * - Hệ thống sử dụng Giao Hàng Nhanh (GHN) làm đối tác vận chuyển chính.
 * - Mọi thao tác lấy Tỉnh/Thành, tính phí ship đều được ủy quyền cho `ghnService`.
 *
 * 2. WEBHOOK & AUTO-UPDATE:
 * - `handleGHNWebhook`: Đây là endpoint "hứng" thông tin từ phía GHN bắn về.
 * - Khi shipper cập nhật trạng thái (Đã lấy hàng, Đang giao, Đã giao), GHN sẽ gọi vào đây.
 * - Hệ thống tự động map trạng thái của GHN sang `OrderStatus` của mình và cập nhật DB -> Gửi Email/Noti cho khách ngay lập tức mà không cần Admin can thiệp.
 *
 * 3. FEE CALCULATION:
 * - Phí vận chuyển được tính dựa trên DistrictID và WardCode.
 * - Mặc định tính theo gói 1kg để có giá dự kiến nhanh nhất cho khách. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tích hợp với GHN/GHTK để lấy mã vận đơn, tính phí ship thời gian thực và tự động cập nhật trạng thái đơn hàng qua Webhook.

 * =====================================================================
 */
@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    public readonly ghnService: GHNService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
  ) {}

  getProvinces(): Promise<Province[]> {
    return this.ghnService.getProvinces();
  }

  getDistricts(provinceId: number): Promise<District[]> {
    return this.ghnService.getDistricts(provinceId);
  }

  getWards(districtId: number): Promise<Ward[]> {
    return this.ghnService.getWards(districtId);
  }

  async calculateFee(
    toDistrictId: number,
    toWardCode: string,
  ): Promise<number> {
    return this.ghnService.calculateFee({
      to_district_id: toDistrictId,
      to_ward_code: toWardCode,
      weight: 1000, // Default weight 1kg
      length: 10,
      width: 10,
      height: 10,
    });
  }

  /**
   * Xử lý Webhook từ GHN để tự động cập nhật trạng thái đơn hàng.
   * GHN Statuses: ready_to_pick, picking, picked, delivering, delivered, cancel, return, returned...
   *
   * Logic: Map trạng thái GHN sang trạng thái nội bộ -> Update DB -> Gửi Noti/Email.
   */
  async handleGHNWebhook(payload: any) {
    const { OrderCode, Status } = payload;

    if (!OrderCode || !Status) {
      this.logger.warn('Invalid GHN Webhook payload', payload);
      return { success: false, message: 'Invalid payload' };
    }

    this.logger.log(`Received GHN Webhook for order ${OrderCode}: ${Status}`);

    // Map GHN Status to our OrderStatus
    let newStatus: OrderStatus | null = null;

    const ghnStatus = Status.toLowerCase();

    if (
      ['picked', 'delivering', 'money_collect_delivering'].includes(ghnStatus)
    ) {
      newStatus = OrderStatus.SHIPPED;
    } else if (ghnStatus === 'ready_to_pick') {
      this.logger.log(`Order ${OrderCode} is ready to pick at GHN`);
      // Optional: Force status to PROCESSING if currently PENDING?
      // newStatus = OrderStatus.PROCESSING;
    } else if (ghnStatus === 'delivered') {
      newStatus = OrderStatus.DELIVERED;
    } else if (ghnStatus === 'cancel') {
      newStatus = OrderStatus.CANCELLED;
    } else if (['return', 'returned'].includes(ghnStatus)) {
      newStatus = OrderStatus.RETURNED;
    }

    if (!newStatus) {
      return { success: true, message: 'Status ignored' };
    }

    try {
      const order = await this.prisma.order.findFirst({
        where: { shippingCode: OrderCode },
      });

      if (!order) {
        this.logger.warn(`Order with shipping code ${OrderCode} not found`);
        return { success: false, message: 'Order not found' };
      }

      // Chỉ cập nhật nếu trạng thái mới khác trạng thái hiện tại hoặc có cập nhật GHN status
      if (order.status !== newStatus || order.ghnStatus !== Status) {
        const updateData: any = { ghnStatus: Status };
        if (newStatus) updateData.status = newStatus;
        if (payload.ExpectedDeliveryTime) {
          updateData.expectedDeliveryTime = new Date(
            payload.ExpectedDeliveryTime,
          );
        }

        // ✅ Lưu lý do hủy nếu có (từ GHN bắn về)
        if (newStatus === OrderStatus.CANCELLED && payload.Reason) {
          updateData.cancellationReason = payload.Reason;
        }

        await this.prisma.order.update({
          where: { id: order.id },
          data: updateData,
        });

        this.logger.log(
          `Cập nhật đơn hàng ${order.id} sang trạng thái ${newStatus || order.status} (GHN: ${Status}) qua Webhook`,
        );

        // ✅ Gửi Notification & Email
        if (
          [
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.RETURNED,
          ].includes(newStatus || order.status)
        ) {
          const updatedOrder = await this.prisma.order.findUnique({
            where: { id: order.id },
            include: {
              user: true,
              items: { include: { sku: { include: { product: true } } } },
              address: true,
            },
          });

          if (updatedOrder) {
            // Send Email
            await this.emailService.sendOrderStatusUpdate(updatedOrder);

            // Send In-App Notification
            let title = 'Cập nhật đơn hàng';
            let message = `Đơn hàng #${order.id.slice(-8)} đã chuyển sang trạng thái ${newStatus}`;
            let notiType = 'ORDER';

            const targetStatus = newStatus || order.status;

            switch (targetStatus) {
              case OrderStatus.SHIPPED:
                title = 'Đơn hàng đang giao';
                message = `Đơn hàng #${order.id.slice(-8)} đã được bàn giao cho đơn vị vận chuyển.`;
                notiType = 'ORDER_SHIPPED';
                break;
              case OrderStatus.DELIVERED:
                title = 'Giao hàng thành công';
                message = `Đơn hàng #${order.id.slice(-8)} đã được giao thành công. Cảm ơn bạn đã mua sắm!`;
                notiType = 'ORDER_DELIVERED';
                break;
              case OrderStatus.CANCELLED:
                title = 'Đơn hàng đã hủy';
                message = `Đơn hàng #${order.id.slice(-8)} của bạn đã bị hủy.`;
                notiType = 'ORDER_CANCELLED';
                break;
              case OrderStatus.RETURNED:
                title = 'Đơn hàng đã hoàn';
                message = `Đơn hàng #${order.id.slice(-8)} của bạn đã được hoàn trả.`;
                notiType = 'ORDER_RETURNED';
                break;
            }

            try {
              const notification = await this.notificationsService.create({
                userId: updatedOrder.userId,
                type: notiType,
                title,
                message,
                link: `/orders/${order.id}`,
              });
              this.notificationsGateway.sendNotificationToUser(
                updatedOrder.userId,
                notification,
              );
            } catch (e) {
              this.logger.error('Failed to send notification in webhook', e);
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing GHN Webhook', error);
      return { success: false, error: error.message };
    }
  }
}
