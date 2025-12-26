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
 * - Khi hàng sắp hết (< 5), hệ thống tự động tìm những ai đang để hàng trong giỏ (Pending Cart) và gửi thông báo thúc giục mua hàng.
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
   * Reserve stock for an order (Checkout).
   * Decrements `stock` and increments `reservedStock`.
   */
  async reserveStock(skuId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    // Atomic update
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
      throw new Error(`Not enough stock for SKU ${skuId}`);
    }

    this.notifyStockUpdate(skuId);
    this.checkLowStock(skuId);
  }

  /**
   * Release stock (Order Cancelled/Expired).
   * Increments `stock` and decrements `reservedStock`.
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
   * Deduct stock permanently (Order Paid/Shipped).
   * Decrements `reservedStock`.
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
   * Check for low stock and notify users who have this item in their cart.
   * ✅ Optimized: Batch notification creation (100x faster)
   */
  private async checkLowStock(skuId: string) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { product: true },
    });

    if (sku && sku.stock < 5) {
      this.logger.warn(
        `LOW STOCK ALERT: SKU ${sku.skuCode} has only ${sku.stock} items left.`,
      );

      // ✅ Single query for all affected users
      const carts = await this.prisma.cart.findMany({
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

      // ✅ Batch create all notifications (1 query instead of N)
      const notifications = carts.map((cart) => ({
        userId: cart.userId,
        type: 'LOW_STOCK',
        title: 'Sản phẩm sắp hết hàng!',
        message: `Sản phẩm ${sku.product.name} trong giỏ hàng của bạn chỉ còn lại ${sku.stock} sản phẩm. Hãy mua ngay kẻo lỡ!`,
        link: '/cart',
        isRead: false,
      }));

      await this.prisma.notification.createMany({
        data: notifications,
      });

      // ✅ Send WebSocket notifications (fire-and-forget)
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
            // Don't fail if WebSocket fails
            this.logger.warn(
              `Failed to send WebSocket to user ${cart.userId}`,
              error,
            );
          }
        }
      }
    }
  }

  /**
   * Fetch current stock and notify via WebSocket
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
        `Failed to notify stock update for SKU ${skuId}: ${error.message}`,
      );
    }
  }
}
