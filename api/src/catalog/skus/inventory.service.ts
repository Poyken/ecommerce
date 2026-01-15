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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONCURRENCY CONTROL (Kiểm soát đồng thời):
 * - Vấn đề kinh điển: 2 user A và B cùng mua sản phẩm cuối cùng CÙNG LÚC.
 * - Giải pháp: Dùng "Atomic Update" với điều kiện `where: { stock: { gte: quantity } }`.
 * - Database sẽ khóa dòng dữ liệu (Row Lock) và chỉ cho phép update nếu điều kiện thỏa mãn.
 * - User chậm hơn 1ms sẽ bị fail do `count === 0` (hàng đã bị người trước mua mất).
 *
 * 2. REAL-TIME UPDATES:
 * - Khi stock thay đổi, ta dùng WebSocket (`StockGateway`) để bắn tin cho tất cả client đang xem sản phẩm đó.
 * - Giúp UI user tự động cập nhật "Còn 5 sản phẩm" -> "Còn 4 sản phẩm" ngay lập tức.
 *
 * 3. FOMO EFFECT (Low Stock Alert):
 * - Khi hàng sắp hết (< 5), hệ thống tự động tìm những ai đang để hàng trong giỏ (Pending Cart) và gửi thông báo thúc giục mua hàng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
    const result = await (prisma.sku as any).updateMany({
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
    this.checkLowStock(skuId);
  }

  /**
   * Hoàn trả tồn kho (Release Stock).
   * - Dùng khi: Đơn hàng bị Hủy (Cancel) hoặc Hết hạn thanh toán (Expire).
   * - Logic: Cộng lại vào `stock` và giảm `reservedStock`.
   */
  async releaseStock(skuId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    await (prisma.sku as any).update({
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

    await (prisma.sku as any).update({
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
  private async checkLowStock(skuId: string) {
    const sku = await (this.prisma.sku as any).findUnique({
      where: { id: skuId },
      include: { product: true },
    });

    // Ngưỡng cảnh báo: < 5 sản phẩm
    if (sku && sku.stock < 5) {
      this.logger.warn(
        `LOW STOCK ALERT: SKU ${sku.skuCode} chỉ còn ${sku.stock} sản phẩm.`,
      );

      // ✅ Query 1 lần để lấy tất cả user bị ảnh hưởng
      const carts = await (this.prisma.cart as any).findMany({
        where: {
          items: {
            some: {
              skuId: skuId,
            },
          },
        },
        select: { userId: true },
      });

      if (carts.length === 0) return;

      // ✅ Batch create (Tạo hàng loạt notification) -> 1 Query thay vì N Query
      const notifications = carts.map((cart) => ({
        userId: cart.userId,
        type: 'LOW_STOCK',
        title: 'Sản phẩm sắp hết hàng!',
        message: `Sản phẩm ${sku.product.name} trong giỏ hàng của bạn chỉ còn lại ${sku.stock} sản phẩm. Hãy mua ngay kẻo lỡ!`,
        link: '/cart',
        isRead: false,
      }));

      await (this.prisma.notification as any).createMany({
        data: notifications,
      });

      // ✅ Gửi WebSocket (Real-time) - Fire-and-forget
      for (const cart of carts) {
        const notification = notifications.find(
          (n) => n.userId === cart.userId,
        );
        if (notification) {
          try {
            this.notificationsGateway.sendNotificationToUser(
              cart.userId,
              notification,
            );
          } catch (error) {
            // Không break luồng nếu lỗi WebSocket
            this.logger.warn(
              `Lỗi gửi WebSocket cho user ${cart.userId}`,
              error,
            );
          }
        }
      }
    }
  }

  /**
   * Lấy tồn kho hiện tại và bắn tin qua WebSocket cho tất cả client đang xem.
   */
  private async notifyStockUpdate(skuId: string) {
    try {
      const sku = await (this.prisma.sku as any).findUnique({
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
