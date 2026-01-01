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
import { MoMoStrategy } from './strategies/momo.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';

@Injectable()
export class PaymentService {
  /**
   * =====================================================================
   * PAYMENT SERVICE - Dịch vụ điều phối thanh toán
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. STRATEGY PATTERN (Mẫu thiết kế Chiến lược):
   * - Thay vì dùng `switch-case` khổng lồ để xử lý từng loại thanh toán (COD, Stripe, VNPAY, MOMO...), ta dùng Pattern này.
   * - Mỗi phương thức thanh toán là một Class riêng (`CodStrategy`, `VnPayStrategy`...) cùng implement một interface.
   *
   * 2. STRATEGY REGISTRY (Map):
   * - `strategies: Map<string, PaymentStrategy>` đóng vai trò như một cuốn danh bạ.
   * - Khi cần thanh toán, chỉ cần tra "tên" (VD: 'VNPAY') trong danh bạ để lấy "thợ" xử lý tương ứng.
   * - Tra cứu bằng Map cực nhanh (O(1)).
   *
   * 3. OPEN/CLOSED PRINCIPLE (Nguyên lý Đóng/Mở):
   * - Code "Mở" cho việc mở rộng: Muốn thêm Momo? Chỉ cần tạo class `MomoStrategy` và đăng ký vào Map.
   * - Code "Đóng" cho việc sửa đổi: Không cần sửa hàm `processPayment` hiện tại -> Giảm rủi ro bug.
   * =====================================================================
   */
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private readonly codStrategy: CodPaymentStrategy,
    private readonly mockStripeStrategy: MockStripeStrategy,
    private readonly vnPayStrategy: VNPayStrategy,
    private readonly momoStrategy: MoMoStrategy,
  ) {
    // Đăng ký các chiến lược
    this.strategies.set('COD', codStrategy);
    this.strategies.set('CREDIT_CARD', mockStripeStrategy); // Ánh xạ CREDIT_CARD sang Stripe
    this.strategies.set('VNPAY', vnPayStrategy);
    this.strategies.set('MOMO', momoStrategy);
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
