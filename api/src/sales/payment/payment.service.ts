import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  CreatePaymentDto,
  PaymentStrategy,
} from './interfaces/payment-strategy.interface';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

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
 * - Code "Đóng" cho việc sửa đổi: Không cần sửa hàm `processPayment` hiện tại -> Giảm rủi ro bug. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Payment Abstraction: Che giấu sự phức tạp của từng cổng thanh toán (VNPAY, Momo, Stripe) dưới một giao diện thống nhất `processPayment`.
 * - Runtime Flexibility: Dễ dàng cấu hình bật/tắt các cổng thanh toán (chỉ cần xóa khỏi Map) mà không cần sửa logic xử lý đơn hàng.
 *
 * =====================================================================
 */

import { OrdersRepository } from '@/sales/orders/orders.repository';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRepo: OrdersRepository,
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
   * Xử lý thanh toán bằng chiến lược đã chọn (Strategy Pattern).
   * @param method Mã phương thức thanh toán (ví dụ: 'COD', 'CREDIT_CARD')
   * @param details Chi tiết thanh toán (Số tiền, ID đơn hàng, v.v.)
   */
  async processPayment(method: string, details: CreatePaymentDto) {
    const strategy = this.strategies.get(method.toUpperCase());

    if (!strategy) {
      throw new BadRequestException(
        `Phương thức thanh toán ${method} không được hỗ trợ.`,
      );
    }

    // Ủy quyền xử lý cho Strategy cụ thể
    return strategy.processPayment(details);
  }

  /**
   * Xử lý Webhook từ cổng thanh toán (Momo, VNPay, Stripe) hoặc giả lập.
   * - Nhiệm vụ: Xác nhận thanh toán thành công và cập nhật trạng thái đơn hàng.
   * - Bảo mật: Cần verify chữ ký (Signature) trong thực tế (được handle bởi Guard hoặc Strategy).
   * @param payload Dữ liệu webhook nhận được
   */
  async handleWebhook(payload: WebhookPayloadDto) {
    this.logger.log(`Processing webhook: ${JSON.stringify(payload)}`);

    // 1. Phân tích nội dung chuyển khoản để tìm Order ID
    // Giả sử nội dung chuyển khoản có dạng: "THANHTOAN <ORDER_ID>" hoặc chỉ chứa ID.
    // Logic thực tế cần Regex phức tạp hơn tùy theo cú pháp quy định với ngân hàng.
    const possibleIds = payload.content.split(/\s+/).map((s) => s.trim());
    let order: import('@prisma/client').Order | null = null;

    // Duyệt qua từng từ trong nội dung để tìm đơn hàng
    for (const id of possibleIds) {
      // Bỏ qua các từ quá ngắn (ID thường dài > 8 ký tự uuid/cuid)
      if (id.length < 8) continue;

      const found = await this.ordersRepo.findById(id);
      if (found) {
        order = found;
        break;
      }
    }

    if (!order) {
      this.logger.warn(
        `Không tìm thấy Order ID hợp lệ trong nội dung webhook: ${payload.content}`,
      );
      throw new NotFoundException(
        'Không tìm thấy đơn hàng trong nội dung thanh toán',
      );
    }

    // Kiểm tra idempotency (Tính lặp lại): Nếu đã thanh toán rồi thì bỏ qua
    if (order.paymentStatus === 'PAID') {
      this.logger.log(`Đơn hàng ${order.id} đã thanh toán trước đó. Bỏ qua.`);
      return { success: true, message: 'Đơn hàng đã được thanh toán' };
    }

    // 2. Validate số tiền thanh toán (Tránh gian lận chuyển thiếu)
    // Lưu ý: So sánh số thực (Float) cần cẩn thận sai số, nhưng ở đây dùng Decimal/Number cơ bản.
    if (payload.amount < Number(order.totalAmount)) {
      this.logger.warn(
        `Số tiền không đủ. Yêu cầu ${String(order.totalAmount)}, nhận được ${payload.amount}`,
      );
      // Có thể update status là "PARTIAL_PAYMENT" hoặc chỉ log cảnh báo
      throw new BadRequestException('Số tiền thanh toán không đủ');
    }

    // 3. Cập nhật trạng thái đơn hàng sang PAID và PROCESSING
    await this.ordersRepo.update(order.id, {
      paymentStatus: 'PAID',
      transactionId: payload.gatewayTransactionId || `TRX-${Date.now()}`,
      // Nếu đơn hàng đang chờ (PENDING) -> Tự động chuyển sang đang xử lý (PROCESSING)
      status: order.status === 'PENDING' ? 'PROCESSING' : order.status,
    } as any);

    this.logger.log(
      `Cập nhật thành công đơn hàng ${order.id} sang trạng thái ĐÃ THANH TOÁN`,
    );
    return { success: true, orderId: order.id };
  }
}
