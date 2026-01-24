import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PaginatedResult } from '@/core/application/pagination';
import { Brand } from '../../../domain/entities/brand.entity';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../../domain/repositories/brand.repository.interface';

export interface ListBrandsInput {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export type ListBrandsOutput = { brands: PaginatedResult<Brand> };
export type ListBrandsError = any;

@Injectable()
export class ListBrandsUseCase extends QueryUseCase<
  ListBrandsInput,
  ListBrandsOutput,
  ListBrandsError
> {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {
    super();
  }

  async execute(
    input: ListBrandsInput,
  ): Promise<Result<ListBrandsOutput, ListBrandsError>> {
    const result = await this.brandRepository.findAll(input.tenantId, {
      page: input.page || 1,
      limit: input.limit || 50,
      search: input.search,
    });

    return Result.ok({ brands: result });
  }
}
