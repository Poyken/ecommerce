import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import { PaymentService } from '../../payment.service';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../../domain/repositories/payment.repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { v4 as uuidv4 } from 'uuid';

export interface InitiatePaymentInput {
  orderId: string;
  method: string;
  ipAddr?: string;
  returnUrl?: string;
}

export interface InitiatePaymentOutput {
  paymentUrl?: string;
  success: boolean;
  paymentId: string;
}

@Injectable()
export class InitiatePaymentUseCase extends CommandUseCase<
  InitiatePaymentInput,
  InitiatePaymentOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  async execute(
    input: InitiatePaymentInput,
  ): Promise<Result<InitiatePaymentOutput>> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      return Result.fail(new Error(`Order ${input.orderId} not found`));
    }

    const payment = Payment.create({
      id: uuidv4(),
      orderId: order.id,
      amount: order.total.amount,
      paymentMethod: input.method,
      tenantId: order.tenantId,
    });

    await this.paymentRepository.save(payment);

    try {
      const result = await this.paymentService.processPayment(input.method, {
        amount: order.total.amount,
        orderId: order.id,
        ipAddr: input.ipAddr,
        returnUrl: input.returnUrl,
      });

      if (!result.success) {
        payment.markAsFailed(result.rawResponse);
        await this.paymentRepository.save(payment);
        return Result.fail(
          new Error(result.message || 'Payment initiation failed'),
        );
      }

      return Result.ok({
        paymentUrl: result.paymentUrl,
        success: true,
        paymentId: payment.id,
      });
    } catch (error) {
      payment.markAsFailed({ error: error.message });
      await this.paymentRepository.save(payment);
      throw error;
    }
  }
}
