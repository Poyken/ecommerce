import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PaginatedResult } from '@/core/application/pagination';
import { Category } from '../../../domain/entities/category.entity';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../../domain/repositories/category.repository.interface';

export interface ListCategoriesInput {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string | null;
}

export type ListCategoriesOutputNormalized = {
  categories: PaginatedResult<Category>;
};
export type ListCategoriesError = any;

@Injectable()
export class ListCategoriesUseCase extends QueryUseCase<
  ListCategoriesInput,
  ListCategoriesOutputNormalized,
  ListCategoriesError
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(
    input: ListCategoriesInput,
  ): Promise<Result<ListCategoriesOutputNormalized, ListCategoriesError>> {
    const result = await this.categoryRepository.findAll(input.tenantId, {
      page: input.page || 1,
      limit: input.limit || 50,
      search: input.search,
      parentId: input.parentId,
    });

    return Result.ok({ categories: result });
  }
}
