import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class InventoryService {
  /**
   * =====================================================================
   * INVENTORY SERVICE - Dịch vụ quản lý tồn kho
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. ATOMIC UPDATES:
   * - Dùng `updateMany` với điều kiện `stock: { gte: quantity }` để đảm bảo KHÔNG BAO GIỜ bán quá số lượng tồn (Race Condition).
   * - Đây là kỹ thuật "Optimistic Locking" hoặc "Compare-and-Swap" ở mức DB.
   *
   * 2. RESERVED STOCK (Hàng đặt trước):
   * - Khi khách đặt đơn nhưng chưa thanh toán/giao, ta chuyển stock sang `reservedStock`.
   * - Nếu hủy đơn -> Trả lại stock.
   * - Nếu giao xong -> Trừ hẳn khỏi reservedStock.
   *
   * 3. LOW STOCK ALERT:
   * - Khi stock < 5, hệ thống tự động tìm những user đang để món này trong giỏ hàng và gửi thông báo nhắc nhở (Marketing FOMO).
   * =====================================================================
   */
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
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

      // Find users who have this SKU in their cart
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

      // Send notification to each user
      for (const cart of carts) {
        try {
          const notification = await this.notificationsService.create({
            userId: cart.userId,
            type: 'LOW_STOCK',
            title: 'Sản phẩm sắp hết hàng!',
            message: `Sản phẩm ${sku.product.name} trong giỏ hàng của bạn chỉ còn lại ${sku.stock} sản phẩm. Hãy mua ngay kẻo lỡ!`,
            link: '/cart',
          });

          this.notificationsGateway.sendNotificationToUser(
            cart.userId,
            notification,
          );
        } catch (error) {
          console.error(
            `Failed to send low stock notification to user ${cart.userId}`,
            error,
          );
        }
      }
    }
  }
}
