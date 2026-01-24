import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PaginatedResult } from '@/core/application/pagination';
import { Sku, SkuStatus } from '../../../domain/entities/sku.entity';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '../../../domain/repositories/sku.repository.interface';

export interface ListSkusInput {
  tenantId: string;
  page?: number;
  limit?: number;
  productId?: string;
  status?: SkuStatus;
  search?: string;
  stockLimit?: number;
}

export type ListSkusOutput = { skus: PaginatedResult<Sku> };
export type ListSkusError = any;

@Injectable()
export class ListSkusUseCase extends QueryUseCase<
  ListSkusInput,
  ListSkusOutput,
  ListSkusError
> {
  constructor(
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(
    input: ListSkusInput,
  ): Promise<Result<ListSkusOutput, ListSkusError>> {
    const result = await this.skuRepository.findAll(input.tenantId, {
      page: input.page || 1,
      limit: input.limit || 50,
      productId: input.productId,
      status: input.status,
      search: input.search,
      stockLimit: input.stockLimit,
    });

    return Result.ok({ skus: result });
  }
}
