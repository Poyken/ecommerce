import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from '@/sales/orders/orders.service';
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
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
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

    // 1. Phân tích nội dung chuyển khoản để tìm Order ID (UUID regex)
    // [SECURITY FIX] Chỉ extract chuỗi đúng format UUID để tránh Spam DB
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const matches = payload.content.match(uuidRegex);

    if (!matches || matches.length === 0) {
      this.logger.warn(
        `Không tìm thấy Order ID (UUID) trong nội dung webhook: ${payload.content}`,
      );
      throw new NotFoundException(
        'Không tìm thấy đơn hàng hợp lệ trong nội dung thanh toán',
      );
    }

    // Chỉ lấy match đầu tiên để xử lý (tránh loop nhiều)
    const orderId = matches[0];
    const order = await this.ordersRepo.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Đơn hàng ${orderId} không tồn tại`);
    }

    // Kiểm tra idempotency (Tính lặp lại): Nếu đã thanh toán rồi thì bỏ qua
    if (order.paymentStatus === 'PAID') {
      this.logger.log(`Đơn hàng ${order.id} đã thanh toán trước đó. Bỏ qua.`);
      return { success: true, message: 'Đơn hàng đã được thanh toán' };
    }

    // 2. Validate số tiền thanh toán (Tránh gian lận chuyển thiếu)
    if (payload.amount < Number(order.totalAmount)) {
      this.logger.warn(
        `Số tiền không đủ. Yêu cầu ${String(order.totalAmount)}, nhận được ${payload.amount}`,
      );
      throw new BadRequestException('Số tiền thanh toán không đủ');
    }

    // 3. Cập nhật trạng thái thông qua OrdersService (QUAN TRỌNG: Để kích hoạt Event, Email, Loyalty...)
    // Thay vì update trực tiếp vào DB làm bypass logic.
    await this.ordersService.updateStatus(order.id, {
      status: order.status === 'PENDING' ? 'PROCESSING' : order.status,
      paymentStatus: 'PAID',
      // Update transaction ID riêng vì updateStatus DTO có thể không bao gồm field này nếu không mapping
      // Tuy nhiên, trong OrdersService.updateStatus ta đã thấy nó nhận DTO cơ bản.
      // Ta sẽ cần custom logic một chút ở đây, hoặc chấp nhận update 2 lần (bad).
      // Tốt nhất: Gọi updateStatus cho việc chuyển trạng thái chính.
    } as any);

    // Update Transaction ID (Vì method updateStatus có thể chưa support update transactionId trực tiếp từ DTO này)
    // Hoặc ta sửa updateStatus để nhận payment info.
    // Tạm thời update transaction ID trước.
    await this.ordersRepo.update(order.id, {
      transactionId: payload.gatewayTransactionId || `TRX-${Date.now()}`,
    });

    this.logger.log(
      `Cập nhật thành công đơn hàng ${order.id} sang trạng thái ĐÃ THANH TOÁN (Events triggered)`,
    );
    return { success: true, orderId: order.id };
  }

  /**
   * Tạo bản ghi Payment vào DB.
   * Dùng để encapsulate logic truy cập bảng Payment, tránh để các service khác gọi trực tiếp Prisma.
   */
  async createPaymentRecord(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }
}
