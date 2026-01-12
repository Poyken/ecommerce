import { Injectable, Logger } from '@nestjs/common';

/**
 * =====================================================================
 * MOCK STRIPE STRATEGY - Chiến lược thanh toán Stripe giả lập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EXTERNAL API SIMULATION:
 * - Trong môi trường phát triển, ta không muốn gọi API thật của Stripe để tránh tốn phí hoặc cấu hình phức tạp.
 * - `setTimeout` được dùng để mô phỏng độ trễ của mạng (Network Latency) khi gọi API bên ngoài.
 *
 * 2. LOGGING:
 * - Sử dụng `Logger` của NestJS để ghi lại quá trình xử lý, giúp việc debug dễ dàng hơn mà không cần dùng `console.log`.
 *
 * 3. PROMISE WRAPPER:
 * - Việc bọc trong `new Promise` cho phép ta kiểm soát chính xác khi nào kết quả được trả về, mô phỏng đúng hành vi bất đồng bộ của các cổng thanh toán online. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
