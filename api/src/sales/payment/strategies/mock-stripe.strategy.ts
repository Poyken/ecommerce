import { Injectable, Logger } from '@nestjs/common';

/**
 * =====================================================================
 * MOCK STRIPE STRATEGY - Chiến lược thanh toán Stripe giả lập
 * =====================================================================
 *
 * =====================================================================
 */
import {
  CreatePaymentDto,
  PaymentResult,
  PaymentStrategy,
} from '../interfaces/payment-strategy.interface';

@Injectable()
export class MockStripeStrategy implements PaymentStrategy {
  private readonly logger = new Logger(MockStripeStrategy.name);

  processPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    this.logger.log(
      `Đang xử lý thanh toán Mock Stripe cho Đơn hàng ${dto.orderId}, Số tiền: ${dto.amount}`,
    );

    // Mô phỏng gọi API bên ngoài
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mô phỏng kịch bản thành công
        resolve({
          success: true,
          transactionId: `STRIPE_MOCK_${Date.now()}`,
          message: 'Thanh toán được ủy quyền qua Mock Stripe',
        });
      }, 500);
    });
  }
}
