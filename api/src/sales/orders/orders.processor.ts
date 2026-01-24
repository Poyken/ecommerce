import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * ORDERS PROCESSOR - Xử lý tác vụ nền cho đơn hàng
 * =====================================================================
 */

@Processor('orders-queue')
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-stock-release':
        return this.handleCheckStockRelease(job.data);
      case 'order-created-post-process':
        return this.handleOrderCreatedPostProcess(job.data);
      case 'low-stock-alert':
        return this.handleLowStockAlert(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCheckStockRelease(data: { orderId: string }) {
    this.logger.log(`[Job] Checking expiration for order ${data.orderId}`);

    // Check order status
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });

    if (!order) {
      this.logger.warn(
        `Order ${data.orderId} not found during expiration check.`,
      );
      return;
    }

    // POLICY: If order is still PENDING after timeout (15 mins), we cancel it and release stock.
    // PENDING usually means payment pending or confirmation pending.
    if (order.status === OrderStatus.PENDING) {
      this.logger.warn(
        `Order ${data.orderId} is still PENDING. Cancelling due to timeout.`,
      );

      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Cancel Order
          await tx.order.update({
            where: { id: data.orderId },
            data: { status: OrderStatus.CANCELLED },
          });

          // 2. Release Stock
          for (const item of order.items) {
            await this.inventoryService.releaseStock(
              item.skuId,
              item.quantity,
              tx,
            );
          }
        });
        this.logger.log(`Order ${data.orderId} cancelled and stock released.`);
      } catch (error) {
        this.logger.error(
          `Failed to release stock for order ${data.orderId}`,
          error,
        );
        throw error; // Let BullMQ retry? Maybe not loop forever.
      }
    } else {
      this.logger.log(
        `Order ${data.orderId} status is ${order.status}. No action taken.`,
      );
    }
  }

  private async handleOrderCreatedPostProcess(data: {
    orderId: string;
    userId: string;
  }) {
    this.logger.log(`[Job] Post-processing for order ${data.orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true, user: true },
    });

    if (!order) return;

    // 1. Send Email
    try {
      await this.emailService.sendOrderConfirmation(order);
    } catch (e) {
      this.logger.error(`Failed to send email for order ${order.id}`, e);
    }

    // 2. Send Notification to User (Order Owner)
    try {
      const notification = await this.notificationsService.create({
        userId: data.userId,
        tenantId: order.tenantId,
        type: 'ORDER_PLACED',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${order.id.slice(-8)} đã được tạo thành công.`,
        link: `/orders/${order.id}`,
      });

      this.notificationsGateway.sendNotificationToUser(
        data.userId,
        notification,
      );
    } catch (e) {
      this.logger.error(`Failed to send notification for order ${order.id}`, e);
    }

    // 3. Send Notification to Admins
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: 'ADMIN',
              },
            },
          },
        },
        select: { id: true, email: true },
      });

      this.logger.log(
        `[Job] Found ${admins.length} admins to notify: ${admins.map((a) => a.email).join(', ')}`,
      );

      if (admins.length > 0) {
        const adminIds = admins.map((admin) => admin.id);
        const adminNotification = {
          type: 'ADMIN_NEW_ORDER',
          title: 'Đơn hàng mới',
          message: `Khách hàng đã đặt đơn hàng mới #${order.id.slice(-8)}.`,
          link: `/admin/orders/${order.id}`,
        };

        // Create notifications in DB
        await this.notificationsService.broadcastToUserIds(
          order.tenantId,
          adminIds,
          adminNotification,
        );

        // Send Real-time
        await Promise.all(
          adminIds.map((adminId) =>
            this.notificationsGateway.sendNotificationToUser(adminId, {
              ...adminNotification,
              id: `temp-${Date.now()}`,
              createdAt: new Date(),
              isRead: false,
              userId: adminId,
            }),
          ),
        );
      }
    } catch (e) {
      this.logger.error(
        `Failed to send admin notification for order ${order.id}`,
        e,
      );
    }
  }

  /**
   * [P11 OPTIMIZATION]: Xử lý cảnh báo hết hàng ngoài luồng transaction checkout.
   */
  private async handleLowStockAlert(data: {
    skuId: string;
    stock: number;
    tenantId: string;
  }) {
    const { skuId, stock, tenantId } = data;
    this.logger.log(
      `[Job] Processing LOW_STOCK_ALERT for SKU ${skuId} (Stock: ${stock})`,
    );

    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { product: true },
    });

    if (!sku) return;

    // 1. Tìm tất cả giỏ hàng có chứa SKU này
    const carts = await this.prisma.cart.findMany({
      where: {
        tenantId,
        items: {
          some: { skuId },
        },
      },
      select: { userId: true },
    });

    if (carts.length === 0) return;

    const userIds = carts.map((c) => c.userId);
    const notificationData = {
      type: 'LOW_STOCK',
      title: 'Sản phẩm sắp hết hàng!',
      message: `Sản phẩm ${sku.product.name} trong giỏ hàng của bạn chỉ còn ${stock} sản phẩm. Mua ngay kẻo lỡ!`,
      link: '/cart',
    };

    // 2. Broadcast qua DB (Batch)
    await this.notificationsService.broadcastToUserIds(
      tenantId,
      userIds,
      notificationData,
    );

    // 3. Gửi WebSocket (Parallel)
    // [P11 FIX]: Use Promise.all to avoid blocking the worker thread with sequential emits
    // For very large numbers (e.g. > 1000), we should ideally use a chunked Promise.all or a specialized broadcast.
    await Promise.all(
      userIds.map((uid) =>
        this.notificationsGateway.sendNotificationToUser(uid, {
          ...notificationData,
          id: `temp-${Date.now()}`,
          isRead: false,
          createdAt: new Date(),
          userId: uid,
        }),
      ),
    );

    this.logger.log(`[Job] Sent low stock alerts to ${userIds.length} users.`);
  }
}
