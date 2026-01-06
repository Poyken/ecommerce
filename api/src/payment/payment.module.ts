import { Module } from '@nestjs/common';

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
 * - `PaymentService` được export để các module khác (như OrderModule) có thể sử dụng để thực hiện thanh toán.
 * =====================================================================
 */
import { PaymentService } from './payment.service';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';

import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment.webhook.controller';
import { VietQrStrategy } from './strategies/vietqr.strategy';

@Module({
  controllers: [PaymentController, PaymentWebhookController],
  providers: [
    PaymentService,
    CodPaymentStrategy,
    MockStripeStrategy,
    VNPayStrategy,
    MoMoStrategy,
    VietQrStrategy,
  ],
  exports: [PaymentService, MoMoStrategy, VietQrStrategy],
})
export class PaymentModule {}
