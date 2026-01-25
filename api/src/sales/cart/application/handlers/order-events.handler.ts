import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '@/sales/domain/events/order-placed.event';
import { ClearCartUseCase } from '../../../application/use-cases/cart/clear-cart.use-case';

@Injectable()
export class OrderEventsHandler {
  private readonly logger = new Logger(OrderEventsHandler.name);

  constructor(private readonly clearCartUseCase: ClearCartUseCase) {}

  @OnEvent('order.placed')
  async handleOrderPlaced(event: OrderPlacedEvent) {
    this.logger.log(
      `Clearing cart for user: ${event.userId} after order: ${event.orderId}`,
    );

    try {
      await this.clearCartUseCase.execute({
        userId: event.userId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to clear cart for user ${event.userId}: ${error.message}`,
      );
    }
  }
}
