import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';

export interface GetOrderInput {
  id: string;
  userId?: string; // Optional: Enforce ownership check
}

export type GetOrderOutput = {
  order: Record<string, unknown>; // Return persistence DTO or specialized DTO
};

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

  async execute(input: GetOrderInput): Promise<Result<GetOrderOutput>> {
    const order = await this.orderRepository.findById(input.id);

    if (!order) {
      return Result.fail(new EntityNotFoundError('Order', input.id));
    }

    // Check Ownership if userId provided
    if (input.userId && (order as any).props.userId !== input.userId) {
      // Simple authorization check inside Use Case
      // In fully strict clean arch, this might be a Policy, but here is fine.
      return Result.fail(new EntityNotFoundError('Order', input.id)); // Mask as not found for security
    }

    return Result.ok({ order: order.toPersistence() });
  }
}
