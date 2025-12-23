import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * =====================================================================
 * PAYMENT SERVICE - Dịch vụ điều phối thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STRATEGY REGISTRY:
 * - Sử dụng một `Map` để lưu trữ và quản lý các chiến lược thanh toán khác nhau.
 * - Giúp việc tra cứu chiến lược theo tên phương thức (`method`) trở nên cực kỳ nhanh chóng (O(1)).
 *
 * 2. DYNAMIC DISPATCH:
 * - Hàm `processPayment` không chứa logic thanh toán cụ thể. Nó chỉ tìm đúng "thợ" (Strategy) và giao việc.
 * - Đây là cách áp dụng nguyên lý Open/Closed: Ta có thể thêm phương thức thanh toán mới mà không cần sửa code của hàm này.
 *
 * 3. ERROR HANDLING:
 * - Kiểm tra xem phương thức người dùng yêu cầu có tồn tại trong hệ thống hay không. Nếu không, trả về lỗi `BadRequestException`.
 * =====================================================================
 */
import {
  CreatePaymentDto,
  PaymentStrategy,
} from './interfaces/payment-strategy.interface';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private readonly codStrategy: CodPaymentStrategy,
    private readonly mockStripeStrategy: MockStripeStrategy,
    private readonly vnPayStrategy: VNPayStrategy,
  ) {
    // Đăng ký các chiến lược
    this.strategies.set('COD', codStrategy);
    this.strategies.set('CREDIT_CARD', mockStripeStrategy); // Ánh xạ CREDIT_CARD sang Stripe
    this.strategies.set('VNPAY', vnPayStrategy);
  }

  /**
   * Xử lý thanh toán bằng chiến lược đã chọn.
   * @param method Mã phương thức thanh toán (ví dụ: 'COD', 'CREDIT_CARD')
   * @param details Chi tiết thanh toán
   */
  async processPayment(method: string, details: CreatePaymentDto) {
    const strategy = this.strategies.get(method.toUpperCase());

    if (!strategy) {
      throw new BadRequestException(
        `Phương thức thanh toán ${method} không được hỗ trợ.`,
      );
    }

    return strategy.processPayment(details);
  }
}
