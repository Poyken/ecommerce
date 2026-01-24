import { Injectable } from '@nestjs/common';

/**
 * =====================================================================
 * COD PAYMENT STRATEGY - Chiến lược thanh toán khi nhận hàng
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
export class CodPaymentStrategy implements PaymentStrategy {
  processPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    // COD đơn giản: Đơn hàng được xác nhận, thanh toán diễn ra sau khi giao hàng.
    // Về mặt kỹ thuật, "xử lý" thanh toán COD có nghĩa là xác nhận đó là một ý định hợp lệ.
    return Promise.resolve({
      success: true,
      message:
        'Đặt hàng thành công với hình thức Thanh toán khi nhận hàng (COD).',
      transactionId: `COD-${Date.now()}-${dto.orderId}`, // ID giao dịch giả
    });
  }
}
