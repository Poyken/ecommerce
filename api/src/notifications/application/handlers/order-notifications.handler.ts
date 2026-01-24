import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '@/sales/orders/domain/events/order-placed.event';
import { OrderCancelledEvent } from '@/sales/orders/domain/events/order-cancelled.event';
import { OrderStatusUpdatedEvent } from '@/sales/orders/domain/events/order-status-updated.event';
import { NotificationsService } from '../../notifications.service';
import { PaymentSuccessfulEvent } from '@/sales/payment/domain/events/payment-successful.event';

@Injectable()
export class OrderNotificationsHandler {
  private readonly logger = new Logger(OrderNotificationsHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('order.placed')
  async handleOrderPlaced(event: OrderPlacedEvent) {
    this.logger.log(`Notifying order.placed for Order: ${event.orderId}`);

    await this.notificationsService.create({
      userId: event.userId,
      title: '🎉 Đặt hàng thành công!',
      message: `Đơn hàng #${event.orderId.substring(0, 8)} đã được tạo thành công và đang chờ xác nhận.`,
      type: 'ORDER',
    });
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent) {
    this.logger.log(`Notifying order.cancelled for Order: ${event.orderId}`);

    await this.notificationsService.create({
      userId: event.userId,
      title: '❌ Đơn hàng đã bị hủy',
      message: `Đơn hàng #${event.orderId.substring(0, 8)} đã bị hủy. Lý do: ${event.reason || 'Không có'}`,
      type: 'ORDER',
    });
  }

  @OnEvent('order.status_updated')
  async handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    this.logger.log(
      `Notifying order.status_updated for Order: ${event.orderId} -> ${event.newStatus}`,
    );

    await this.notificationsService.create({
      userId: event.userId,
      title: '📦 Cập nhật trạng thái đơn hàng',
      message: `Đơn hàng #${event.orderId.substring(0, 8)} đã chuyển sang trạng thái: ${event.newStatus}.`,
      type: 'ORDER',
    });
  }

  @OnEvent('payment.successful')
  async handlePaymentSuccessful(event: PaymentSuccessfulEvent) {
    this.logger.log(`Notifying payment.successful for Order: ${event.orderId}`);

    await this.notificationsService.create({
      userId: event.userId,
      title: '💰 Thanh toán thành công!',
      message: `Đơn hàng #${event.orderId.substring(0, 8)} đã được thanh toán thành công.`,
      type: 'ORDER',
    });
  }
}
