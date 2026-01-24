import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { Category } from '../../../domain/entities/category.entity';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../../domain/repositories/category.repository.interface';

export interface GetCategoryInput {
  id: string;
  tenantId: string;
}

export type GetCategoryOutput = { category: Category };
export type GetCategoryError = EntityNotFoundError;

@Injectable()
export class GetCategoryUseCase extends QueryUseCase<
  GetCategoryInput,
  GetCategoryOutput,
  GetCategoryError
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(
    input: GetCategoryInput,
  ): Promise<Result<GetCategoryOutput, GetCategoryError>> {
    const category = await this.categoryRepository.findById(input.id);

    if (!category || category.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Category', input.id));
    }

    return Result.ok({ category });
  }
}
