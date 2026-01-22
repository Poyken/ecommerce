import { Module, forwardRef } from '@nestjs/common';

/**
 * =====================================================================
 * PAYMENT MODULE - Module quản lý thanh toán
 * =====================================================================
 *
 * =====================================================================
 */
import { PaymentService } from './payment.service';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';

import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment.webhook.controller';
import { AnalyticsModule } from '@/platform/analytics/analytics.module';
import { OrdersModule } from '@/sales/orders/orders.module';

@Module({
  imports: [AnalyticsModule, forwardRef(() => OrdersModule)],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [
    PaymentService,
    CodPaymentStrategy,
    MockStripeStrategy,
    VNPayStrategy,
    MoMoStrategy,
  ],
  exports: [PaymentService, MoMoStrategy],
})
export class PaymentModule {}
