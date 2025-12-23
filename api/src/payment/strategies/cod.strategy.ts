import { Injectable } from '@nestjs/common';

/**
 * =====================================================================
 * COD PAYMENT STRATEGY - Chiến lược thanh toán khi nhận hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INTERFACE IMPLEMENTATION:
 * - `CodPaymentStrategy` triển khai interface `PaymentStrategy`.
 * - Điều này bắt buộc class phải có hàm `processPayment`, đảm bảo tính nhất quán giữa các phương thức thanh toán.
 *
 * 2. COD LOGIC:
 * - Thanh toán COD không cần gọi API bên thứ ba ngay lập tức.
 * - Ta chỉ cần tạo một `transactionId` giả để ghi nhận ý định thanh toán và trả về `success: true`.
 *
 * 3. ASYNCHRONOUS:
 * - Mặc dù không xử lý gì phức tạp, hàm vẫn trả về `Promise` để tương thích với các chiến lược thanh toán online (như Stripe) cần gọi mạng.
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
