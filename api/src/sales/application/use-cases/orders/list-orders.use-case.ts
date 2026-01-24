import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
  OrderQueryOptions,
} from '../../../domain/repositories/order.repository.interface';
import { Order } from '../../../domain/entities/order.entity';
import { PaginatedResult } from '@core/application/pagination';

export interface ListOrdersInput extends OrderQueryOptions {
  tenantId: string;
}

export type ListOrdersOutput = PaginatedResult<Order>;

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

  async execute(
    input: ListOrdersInput,
  ): Promise<Result<ListOrdersOutput, any>> {
    const { tenantId, ...options } = input;
    const result = await this.orderRepository.findAll(tenantId, options);
    return Result.ok(result);
  }
}
