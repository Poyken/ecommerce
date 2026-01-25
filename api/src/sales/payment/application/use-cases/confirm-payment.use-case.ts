import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../../domain/repositories/payment.repository.interface';
import { OrderStatus } from '@/sales/domain/enums/order-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentSuccessfulEvent } from '../../domain/events/payment-successful.event';

export interface ConfirmPaymentInput {
  orderId: string;
  gatewayTransactionId: string;
  amount: number;
  metadata?: any;
  status: 'SUCCESS' | 'FAILED';
}

@Injectable()
export class ConfirmPaymentUseCase extends CommandUseCase<
  ConfirmPaymentInput,
  void
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(input: ConfirmPaymentInput): Promise<Result<void>> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) return Result.fail(new Error('Order not found'));

    const payments = await this.paymentRepository.findByOrderId(order.id);
    let payment = payments.length > 0 ? payments[0] : null;

    if (input.status === 'SUCCESS') {
      order.markAsPaid();
      if (order.status === OrderStatus.PENDING) {
        order.confirm(payment?.id || 'ONLINE', input.gatewayTransactionId);
      }

      if (payment) {
        payment.markAsPaid(input.gatewayTransactionId, input.metadata);
      }

      await this.orderRepository.save(order);
      if (payment) {
        await this.paymentRepository.save(payment);
      }

      // Emit event for analytics, commissions, etc.
      this.eventEmitter.emit(
        'payment.successful',
        new PaymentSuccessfulEvent(
          order.id,
          payment?.id || 'MANUAL',
          input.amount,
          order.tenantId,
          order.userId,
          input.gatewayTransactionId,
        ),
      );
    } else {
      if (payment) {
        payment.markAsFailed(input.metadata);
        await this.paymentRepository.save(payment);
      }
    }

    return Result.ok(undefined);
  }
}
