import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  EntityNotFoundError,
  ForbiddenError,
} from '@/core/domain/errors/domain.error';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../../domain/repositories/order.repository.interface';
import { Order } from '../../../domain/entities/order.entity';

export interface GetOrderInput {
  orderId: string;
  userId?: string; // Optional: used for security check if provided
  isAdmin?: boolean;
}

export type GetOrderOutput = { order: Order };

@Injectable()
export class GetOrderUseCase extends QueryUseCase<
  GetOrderInput,
  GetOrderOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {
    super();
  }

  async execute(input: GetOrderInput): Promise<Result<GetOrderOutput, any>> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail(new EntityNotFoundError('Order', input.orderId));
    }

    // Security check: if userId is provided and user is not admin
    if (input.userId && !input.isAdmin && order.customerId !== input.userId) {
      return Result.fail(
        new ForbiddenError('You do not have permission to view this order'),
      );
    }

    return Result.ok({ order });
  }
}
