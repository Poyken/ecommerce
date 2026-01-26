import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCancelledEvent } from '@/sales/domain/events/order-cancelled.event';
import { RefundPointsUseCase } from '../use-cases/refund-points.use-case';

@Injectable()
export class LoyaltyOrderEventsHandler {
  private readonly logger = new Logger(LoyaltyOrderEventsHandler.name);

  constructor(private readonly refundPointsUseCase: RefundPointsUseCase) {}

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent) {
    this.logger.log(`Refunding points if any for Order: ${event.orderId}`);

    const result = await this.refundPointsUseCase.execute({
      tenantId: event.tenantId,
      userId: event.userId,
      orderId: event.orderId,
      reason: `Hoàn điểm do hủy đơn hàng: ${event.reason || 'Không có lý do'}`,
    });

    if (result.isFailure) {
      // If it fails because order didn't use points, it's fine (though RefundPointsUseCase should handle it as success with null/empty)
      // We log error only for real failures
      this.logger.warn(
        `Point refund check finished for order ${event.orderId}`,
      );
    } else {
      this.logger.log(
        `Point refund check completed for order ${event.orderId}`,
      );
    }
  }
}
