import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';

@Module({
  providers: [PaymentService, CodPaymentStrategy, MockStripeStrategy],
  exports: [PaymentService],
})
export class PaymentModule {}
