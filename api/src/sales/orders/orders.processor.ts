import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { OrderStatus } from '@/sales/domain/enums/order-status.enum';

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
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
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

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) return;

    // POLICY: If order is still PENDING after timeout, we cancel it.
    if (order.status === 'PENDING') {
      this.logger.warn(`Order ${data.orderId} PENDING timeout. Cancelling.`);
      await this.updateOrderStatusUseCase.execute({
        orderId: data.orderId,
        status: OrderStatus.CANCELLED,
        reason: 'Payment timeout (15 mins)',
      });
    }
  }

  private async handleOrderCreatedPostProcess(data: {
    orderId: string;
    userId: string;
  }) {
    this.logger.log(`[Job] Post-processing for order ${data.orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });

    if (!order) return;

    // 1. Send Email (Legacy logic, can be specialized to UseCase later)
    try {
      await this.emailService.sendOrderConfirmation(order as any);
    } catch (e) {
      this.logger.error(`Failed to send email for order ${order.id}`, e);
    }

    // 2. Real-time Notifications are handled by the Use Case events now
    // but we can add specialized Admin alerting if needed.
  }

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

    const carts = await this.prisma.cart.findMany({
      where: { tenantId, items: { some: { skuId } } },
      select: { userId: true },
    });

    if (carts.length === 0) return;

    const userIds = carts.map((c) => c.userId);
    const notificationData = {
      type: 'LOW_STOCK',
      title: 'Sản phẩm sắp hết hàng!',
      message: `Sản phẩm ${sku.product.name} trong giỏ hàng bạn còn ${stock} cái.`,
      link: '/cart',
    };

    await this.notificationsService.broadcastToUserIds(
      tenantId,
      userIds,
      notificationData,
    );

    userIds.forEach((uid) => {
      this.notificationsGateway.sendNotificationToUser(uid, {
        ...notificationData,
        id: `temp-${Date.now()}`,
        isRead: false,
        createdAt: new Date(),
        userId: uid,
      } as any);
    });
  }
}
