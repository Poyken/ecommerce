import { Module, forwardRef } from '@nestjs/common';

/**
 * =====================================================================
 * PAYMENT MODULE - Module quản lý thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STRATEGY PATTERN (Mẫu chiến lược):
 * - Module này được thiết kế để hỗ trợ nhiều phương thức thanh toán khác nhau (COD, Stripe, v.v.) mà không làm thay đổi logic chính.
 * - Mỗi phương thức thanh toán là một "Strategy" riêng biệt được đăng ký trong `providers`.
 *
 * 2. DEPENDENCY INJECTION:
 * - `PaymentService` sẽ sử dụng các Strategy này để xử lý thanh toán dựa trên lựa chọn của người dùng.
 *
 * 3. EXPORTS:
 * - `PaymentService` được export để các module khác (như OrderModule) có thể sử dụng để thực hiện thanh toán. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { PaymentService } from './payment.service';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';

import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment.webhook.controller';
import { AnalyticsModule } from '@/analytics/analytics.module';
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
