import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import { OrderStatus } from '@/sales/domain/enums/order-status.enum';

export interface ListOrdersInput {
  userId?: string;
  status?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
}

export type ListOrdersOutput = {
  orders: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
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
    const { tenantId = 'default', ...filters } = input;

    try {
      const result = await this.orderRepository.findAll(tenantId, {
        customerId: filters.userId,
        status: filters.status as OrderStatus,
        page: filters.page || 1,
        limit: filters.limit || 10,
        search: filters.search,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });

      return Result.ok({
        orders: result.data.map((o) => o.toPersistence()),
        meta: {
          total: result.meta.total || 0,
          page: result.meta.page || 1,
          limit: result.meta.limit || 10,
          lastPage: result.meta.lastPage || 1,
        },
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
