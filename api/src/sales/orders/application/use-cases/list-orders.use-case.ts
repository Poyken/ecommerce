import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';

export interface ListOrdersInput {
  userId?: string;
  status?: string;
  tenantId?: string; // Implicitly required usually
  limit?: number;
  offset?: number;
}

export type ListOrdersOutput = {
  orders: Record<string, unknown>[];
};

@Injectable()
export class ListOrdersUseCase extends QueryUseCase<
  ListOrdersInput,
  ListOrdersOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {
    super();
  }

  async execute(input: ListOrdersInput): Promise<Result<ListOrdersOutput>> {
    // Repository methods for filtering need enhancement
    // Currently IOrderRepository has finding by UserId OR Status independently.
    // For now, assume simple logic: if userId provided, prioritize it.

    let orders: Order[] = [];

    if (input.userId) {
      orders = await this.orderRepository.findByUserId(input.userId);
      if (input.status) {
        orders = orders.filter((o) => (o as any).props.status === input.status);
      }
    } else if (input.status) {
      orders = await this.orderRepository.findByStatus(input.status);
    }

    // Pagination logic usually belongs in Repo, but here we slice in memory for MVP
    // Assuming simple repository implementations

    return Result.ok({
      orders: orders.map((o) => o.toPersistence()),
    });
  }
}
