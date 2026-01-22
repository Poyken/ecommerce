import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from './events/order-created.event';
import { OrderStatusUpdatedEvent } from './events/order-status-updated.event';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { LoyaltyService } from '@/marketing/loyalty/loyalty.service';
import { PaymentService } from '@/sales/payment/payment.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderSubscriber {
  private readonly logger = new Logger(OrderSubscriber.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly loyaltyService: LoyaltyService,
    private readonly paymentService: PaymentService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Post-process for order.created: ${event.orderId}`);
    
    // 1. Send Order Confirmation Email (Async)
    const order = await this.prisma.order.findUnique({
        where: { id: event.orderId },
        include: { items: true, user: true }
    });
    if (order) {
        await this.emailService.sendOrderConfirmation(order as any).catch(e => this.logger.error('Email error', e));
    }

    // 2. Initial Notification
    await this.notificationsService.create({
        userId: event.userId,
        type: 'ORDER_CREATED',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${event.orderId.slice(-8)} đã được tạo thành công.`,
        link: `/orders/${event.orderId}`,
    }).catch(e => this.logger.error('Notification error', e));
  }

  @OnEvent('order.status.updated')
  async handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    this.logger.log(`Handling order.status.updated for order ${event.orderId}`);

    const order = await this.prisma.order.findUnique({
        where: { id: event.orderId },
        include: { user: true }
    });

    if (!order) return;

    // 1. Send Email
    await this.emailService.sendOrderStatusUpdate(order as any).catch(e => this.logger.error('Email error', e));

    // 2. Notifications
    const notification = await this.notificationsService.create({
        userId: event.userId,
        type: 'ORDER_STATUS_UPDATE',
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${event.orderId.slice(-8)} đã chuyển sang trạng thái ${event.newStatus}`,
        link: `/orders/${event.orderId}`,
    });

    this.notificationsGateway.sendNotificationToUser(event.userId, notification);

    // 3. LoyaltyPoints on DELIVERED
    if (event.newStatus === OrderStatus.DELIVERED) {
        await this.loyaltyService.earnPointsFromOrder(event.tenantId, event.orderId).catch(e => this.logger.error('Loyalty error', e));
    }
  }
}
