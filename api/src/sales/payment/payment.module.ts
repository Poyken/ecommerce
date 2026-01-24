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

// Use Cases
import * as UseCases from './application/use-cases';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository.interface';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';

@Module({
  imports: [AnalyticsModule, forwardRef(() => OrdersModule)],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [
    PaymentService,
    CodPaymentStrategy,
    MockStripeStrategy,
    VNPayStrategy,
    MoMoStrategy,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
    ...Object.values(UseCases),
  ],
  exports: [PaymentService, MoMoStrategy, ...Object.values(UseCases)],
})
export class PaymentModule {}
