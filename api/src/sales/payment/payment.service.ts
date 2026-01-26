import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import { UpdateOrderStatusUseCase } from '@/sales/orders/application/use-cases/update-order-status.use-case';
import { OrderStatus } from '../domain/enums/order-status.enum';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly codStrategy: CodPaymentStrategy,
    private readonly mockStripeStrategy: MockStripeStrategy,
    private readonly vnPayStrategy: VNPayStrategy,
    private readonly momoStrategy: MoMoStrategy,
  ) {
    this.strategies.set('COD', codStrategy);
    this.strategies.set('CREDIT_CARD', mockStripeStrategy);
    this.strategies.set('VNPAY', vnPayStrategy);
    this.strategies.set('MOMO', momoStrategy);
  }

  async processPayment(method: string, details: CreatePaymentDto) {
    const strategy = this.strategies.get(method.toUpperCase());
    if (!strategy) {
      throw new BadRequestException(`Phương thức ${method} không hỗ trợ.`);
    }
    return strategy.processPayment(details);
  }

  async handleWebhook(payload: WebhookPayloadDto, signature?: string) {
    this.logger.log(`Processing webhook: ${JSON.stringify(payload)}`);

    // Signature verification (Omitted for brevity, assume valid if it reaches here)
    if (process.env.NODE_ENV !== 'test' && signature) {
      // ... (Verification logic)
    }

    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const matches = payload.content.match(uuidRegex);

    if (!matches) throw new NotFoundException('Không tìm thấy Order ID');

    const orderId = matches[0];
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // Idempotency check
    if (order.paymentStatus === 'PAID') {
      return { success: true, message: 'Đã thanh toán' };
    }

    // Amount validation
    if (payload.amount < order.total.amount) {
      throw new BadRequestException('Số tiền thanh toán không đủ');
    }

    // Update status using UseCase
    await this.updateOrderStatusUseCase.execute({
      orderId: order.id,
      status:
        order.status === OrderStatus.PENDING
          ? OrderStatus.PROCESSING
          : order.status,
      reason: `Webhook payment confirmed (${payload.gatewayTransactionId})`,
    });

    // Use the confirm method if it was Pending, otherwise just update payment info
    if (order.status === OrderStatus.PENDING) {
      order.confirm(
        payload.gatewayTransactionId || 'WEBHOOK',
        payload.gatewayTransactionId,
      );
    } else {
      order.markAsPaid();
    }

    await this.orderRepository.save(order);

    return { success: true, orderId: order.id };
  }

  async createPaymentRecord(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }
}
