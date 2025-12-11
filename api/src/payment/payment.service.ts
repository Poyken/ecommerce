import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreatePaymentDto,
  PaymentStrategy,
} from './interfaces/payment-strategy.interface';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private readonly codStrategy: CodPaymentStrategy,
    private readonly mockStripeStrategy: MockStripeStrategy,
  ) {
    // Đăng ký các chiến lược
    this.strategies.set('COD', codStrategy);
    this.strategies.set('CREDIT_CARD', mockStripeStrategy); // Ánh xạ CREDIT_CARD sang Stripe
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
