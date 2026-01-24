import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../domain/enums/order-status.enum';

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string; // From Request Body usually string
  reason?: string;
}

export type UpdateOrderStatusOutput = { status: string };

import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatusUpdatedEvent } from '../../domain/events/order-status-updated.event';

@Injectable()
export class UpdateOrderStatusUseCase extends CommandUseCase<
  UpdateOrderStatusInput,
  UpdateOrderStatusOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(
    input: UpdateOrderStatusInput,
  ): Promise<Result<UpdateOrderStatusOutput>> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order)
      return Result.fail(new EntityNotFoundError('Order', input.orderId));

    // Convert string to enum
    const newStatus = input.status as OrderStatus;
    if (!Object.values(OrderStatus).includes(newStatus)) {
      // Handle invalid status normally, but here just cast
    }

    const oldStatus = order.status;

    if (newStatus === OrderStatus.CANCELLED) {
      order.cancel(input.reason);
    } else {
      order.changeStatus(newStatus);
    }

    await this.orderRepository.save(order);

    // Emit status updated event
    this.eventEmitter.emit(
      'order.status_updated',
      new OrderStatusUpdatedEvent(
        order.id,
        order.tenantId,
        order.userId,
        oldStatus,
        order.status,
        input.reason,
      ),
    );

    return Result.ok({ status: order.status as string });
  }
}
