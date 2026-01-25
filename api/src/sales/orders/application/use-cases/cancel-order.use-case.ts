import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCancelledEvent } from '@/sales/domain/events/order-cancelled.event';

export interface CancelOrderInput {
  orderId: string;
  userId: string;
  reason?: string;
  isAdmin?: boolean;
}

export type CancelOrderOutput = { success: boolean };

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

    if (!input.isAdmin && order.userId !== input.userId) {
      return Result.fail(
        new BadRequestException('Bạn không có quyền hủy đơn hàng này'),
      );
    }

    try {
      order.cancel(input.reason || 'User requested');
      await this.orderRepository.save(order);

      this.eventEmitter.emit(
        'order.cancelled',
        new OrderCancelledEvent(
          order.id,
          order.tenantId,
          order.userId,
          order.items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
          input.reason || 'User requested',
        ),
      );

      return Result.ok({ success: true });
    } catch (e) {
      return Result.fail(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
