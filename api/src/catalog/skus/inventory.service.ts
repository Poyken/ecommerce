import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { StockGateway } from './stock.gateway';

/**
 * =====================================================================
 * INVENTORY SERVICE - Quản lý tồn kho
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly stockGateway: StockGateway,
  ) {}

  /**
   * Giữ tồn kho (Reserve Stock) cho đơn hàng (Khi user bấm Checkout).
   * - Giảm `stock` (tồn kho khả dụng).
   * - Tăng `reservedStock` (hàng đã đặt nhưng chưa giao).
   * - Sử dụng "Atomic Update" để tránh race condition.
   */
  async reserveStock(skuId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    // Cập nhật nguyên tử: chỉ giảm nếu stock >= quantity
    const result = await prisma.sku.updateMany({
      where: {
        id: skuId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
        reservedStock: { increment: quantity },
      },
    });

    if (result.count === 0) {
      throw new Error(`Không đủ tồn kho cho SKU ${skuId}`);
    }

    this.notifyStockUpdate(skuId);
    await this.checkLowStock(skuId, tx);
  }

  /**
   * Giữ tồn kho (Reserve Stock) cho nhiều sản phẩm cùng lúc.
   * - Optimization: Dùng Promise.all để tận dụng concurrency của DB Transaction.
   */
  async reserveStockBatch(
    items: { skuId: string; quantity: number }[],
    tx?: any,
  ) {
    // 1. Reserve từng món (Parallel)
    // Prisma trong transaction sẽ serialize, nhưng code gọn hơn loop thường.
    await Promise.all(
      items.map((item) => this.reserveStock(item.skuId, item.quantity, tx)),
    );
  }

  /**
   * Hoàn trả tồn kho (Release Stock).
   * - Dùng khi: Đơn hàng bị Hủy (Cancel) hoặc Hết hạn thanh toán (Expire).
   * - Logic: Cộng lại vào `stock` và giảm `reservedStock`.
   */
  async releaseStock(skuId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    await prisma.sku.update({
      where: { id: skuId },
      data: {
        stock: { increment: quantity },
        reservedStock: { decrement: quantity },
      },
    });

    this.notifyStockUpdate(skuId);
  }

  /**
   * Trừ kho vĩnh viễn (Deduct Stock).
   * - Dùng khi: Đơn hàng đã Giao thành công (Completed) hoặc đã xuất kho.
   * - Logic: Chỉ giảm `reservedStock`, không đụng vào `stock` (vì `stock` đã giảm lúc reserve rồi).
   */
  async deductStock(skuId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    await prisma.sku.update({
      where: { id: skuId },
      data: {
        reservedStock: { decrement: quantity },
      },
    });
  }

  /**
   * Kiểm tra và cảnh báo sắp hết hàng (Low Stock Alert).
   * - Gửi thông báo cho những user đang để sản phẩm này trong giỏ hàng (Cart).
   * - Tăng tỷ lệ chuyển đổi bằng hiệu ứng FOMO (Fear Of Missing Out).
   *
   * ✅ TỐI ƯU HÓA: Gửi batch notification (nhanh hơn 100x).
   */
  /**
   * Kiểm tra và cảnh báo sắp hết hàng (Low Stock Alert).
   *
   * [SENIOR ARCHITECTURE]: Không gửi notification/websocket trực tiếp trong transaction.
   * Thay vào đó, tạo OutboxEvent để worker xử lý async.
   */
  private async checkLowStock(skuId: string, tx?: any) {
    const prisma = tx || this.prisma;

    const sku = await prisma.sku.findUnique({
      where: { id: skuId },
      select: { stock: true, skuCode: true, tenantId: true },
    });

    // Ngưỡng cảnh báo: < 5 sản phẩm
    if (sku && sku.stock < 5) {
      this.logger.debug(
        `Queuing LOW_STOCK_ALERT for SKU ${sku.skuCode} (Stock: ${sku.stock})`,
      );

      await prisma.outboxEvent.create({
        data: {
          aggregateType: 'SKU',
          aggregateId: skuId,
          type: 'LOW_STOCK_ALERT',
          payload: {
            skuId,
            stock: sku.stock,
            tenantId: sku.tenantId,
          },
        },
      });
    }
  }

  /**
   * Lấy tồn kho hiện tại và bắn tin qua WebSocket cho tất cả client đang xem.
   */
  private async notifyStockUpdate(skuId: string) {
    try {
      const sku = await this.prisma.sku.findUnique({
        where: { id: skuId },
        select: { stock: true, productId: true },
      });

      if (sku) {
        this.stockGateway.emitStockUpdate(sku.productId, skuId, sku.stock);
      }
    } catch (error) {
      this.logger.error(
        `Lỗi khi thông báo cập nhật tồn kho SKU ${skuId}: ${error.message}`,
      );
    }
  }
}
