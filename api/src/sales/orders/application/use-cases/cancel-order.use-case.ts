import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from '@/core/domain/errors/domain.error';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';

export interface CancelOrderInput {
  orderId: string;
  userId: string; // User requesting cancellation
  reason?: string;
  isAdmin?: boolean; // Or isSupport
}

export type CancelOrderOutput = { success: boolean };

import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCancelledEvent } from '../../domain/events/order-cancelled.event';

@Injectable()
export class CancelOrderUseCase extends CommandUseCase<
  CancelOrderInput,
  CancelOrderOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(input: CancelOrderInput): Promise<Result<CancelOrderOutput>> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order)
      return Result.fail(new EntityNotFoundError('Order', input.orderId));

    // Authorization: User ID match or Admin
    if (!input.isAdmin && order.userId !== input.userId) {
      return Result.fail(new EntityNotFoundError('Order', input.orderId));
    }

    try {
      order.cancel(input.reason);
      await this.orderRepository.save(order);

      // Emit event
      this.eventEmitter.emit(
        'order.cancelled',
        new OrderCancelledEvent(
          order.id,
          order.tenantId,
          order.userId,
          order.items.map((i) => ({
            skuId: i.skuId,
            quantity: i.quantity,
          })),
          input.reason,
        ),
      );

      return Result.ok({ success: true });
    } catch (e) {
      return Result.fail(new BusinessRuleViolationError((e as Error).message));
    }
  }
}
