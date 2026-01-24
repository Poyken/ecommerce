import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentSuccessfulEvent } from '@/sales/payment/domain/events/payment-successful.event';
import { CommissionService } from '../../commission.service';

@Injectable()
export class PaymentEventsHandler {
  private readonly logger = new Logger(PaymentEventsHandler.name);

  constructor(private readonly commissionService: CommissionService) {}

  @OnEvent('payment.successful')
  async handlePaymentSuccessful(event: PaymentSuccessfulEvent) {
    this.logger.log(`Handling payment.successful for Order: ${event.orderId}`);

    try {
      // Calculate commissions and fees automatically
      await this.commissionService.calculateForOrder(event.orderId);
      this.logger.log(`Commission calculated for order ${event.orderId}`);
    } catch (error) {
      this.logger.error(
        `Failed to calculate commission for order ${event.orderId}: ${error.message}`,
      );
    }
  }
}
