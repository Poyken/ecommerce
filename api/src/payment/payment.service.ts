import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

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
import {
  CreatePaymentDto,
  PaymentStrategy,
} from './interfaces/payment-strategy.interface';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';
import { VietQrStrategy } from './strategies/vietqr.strategy';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly codStrategy: CodPaymentStrategy,
    private readonly mockStripeStrategy: MockStripeStrategy,
    private readonly vnPayStrategy: VNPayStrategy,
    private readonly momoStrategy: MoMoStrategy,
    private readonly vietQrStrategy: VietQrStrategy,
  ) {
    // Đăng ký các chiến lược
    this.strategies.set('COD', codStrategy);
    this.strategies.set('CREDIT_CARD', mockStripeStrategy); // Ánh xạ CREDIT_CARD sang Stripe
    this.strategies.set('VNPAY', vnPayStrategy);
    this.strategies.set('MOMO', momoStrategy);
    this.strategies.set('VIETQR', vietQrStrategy);
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

  /**
   * Xử lý webhook từ cổng thanh toán (hoặc giả lập)
   * @param payload Dữ liệu webhook nhận được
   */
  async handleWebhook(payload: WebhookPayloadDto) {
    this.logger.log(`Processing webhook: ${JSON.stringify(payload)}`);

    // 1. Phân tích nội dung để tìm Order ID
    // Giả sử nội dung chuyển khoản có dạng: "THANHTOAN <ORDER_ID>" hoặc chỉ chứa ID
    // Ta sẽ tìm chuỗi nào khớp với định dạng CLR... (tùy format ID của bạn)
    // Ở đây đơn giản là tìm chuỗi Order ID trong content.

    // Cải thiện logic parse ID: Tìm chuỗi bắt đầu bằng 'clr' (nếu dùng cuid) hoặc uuid
    // Trong context này, giả sử Order ID là chuỗi được gửi kèm.

    // Logic đơn giản: Regex tìm order id từ content (giả sử order id ko có khoảng trắng)
    // Ví dụ content: "Thanh toan don hang clr123456..."
    // Trong thực tế cần regex chính xác hơn dựa trên format Order ID của hệ thống.

    // Tạm thời: Lấy tất cả các từ trong content và check xem từ nào là Order ID tồn tại trong DB
    const possibleIds = payload.content.split(/\s+/).map((s) => s.trim());

    let order: any = null; // Use explicit type or let Prisma inference work, using 'any' temporarily to bypass if complexity is high, but better to use proper type if available.
    // Better approach:

    for (const id of possibleIds) {
      // Bỏ qua các từ quá ngắn
      if (id.length < 8) continue;

      const found = await this.prisma.order.findUnique({ where: { id } });
      if (found) {
        order = found;
        break;
      }
    }

    if (!order) {
      this.logger.warn(
        `Could not find valid Order ID in webhook content: ${payload.content}`,
      );
      throw new NotFoundException('Order not found in webhook content');
    }

    if (order.paymentStatus === 'PAID') {
      this.logger.log(`Order ${order.id} is already PAID. Ignoring.`);
      return { success: true, message: 'Order already paid' };
    }

    // 2. Validate số tiền
    if (payload.amount < Number(order.totalAmount)) {
      this.logger.warn(
        `Insufficient amount. Expected ${order.totalAmount}, got ${payload.amount}`,
      );
      // Có thể update status là "PARTIAL_PAYMENT" hoặc chỉ log cảnh báo
      throw new BadRequestException('Insufficient payment amount');
    }

    // 3. Update Order Status
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        transactionId: payload.gatewayTransactionId || `TRX-${Date.now()}`,
        status: order.status === 'PENDING' ? 'PROCESSING' : order.status,
        // Nếu đang PENDING -> Auto chuyển PROCESSING khi đã thanh toán
      },
    });

    this.logger.log(`Successfully updated Order ${order.id} to PAID`);
    return { success: true, orderId: order.id };
  }
}
