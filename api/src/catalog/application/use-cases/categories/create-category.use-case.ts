import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import { Category } from '../../../domain/entities/category.entity';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../../domain/repositories/category.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCategoryInput {
  tenantId: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  parentId?: string;
}

export type CreateCategoryOutput = { category: Category };
export type CreateCategoryError =
  | BusinessRuleViolationError
  | EntityNotFoundError;

@Injectable()
export class CreateCategoryUseCase extends CommandUseCase<
  CreateCategoryInput,
  CreateCategoryOutput,
  CreateCategoryError
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(
    input: CreateCategoryInput,
  ): Promise<Result<CreateCategoryOutput, CreateCategoryError>> {
    // 1. Create temporary entity to generate slug (or validate)
    const newCategory = Category.create({
      id: uuidv4(),
      ...input,
    });

    // 2. Check slug uniqueness
    const isUnique = await this.categoryRepository.isSlugUnique(
      input.tenantId,
      newCategory.slug.value,
    );
    if (!isUnique) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Category slug '${newCategory.slug.value}' already exists`,
        ),
      );
    }

    // 3. Check parent if exists
    if (input.parentId) {
      const parent = await this.categoryRepository.findById(input.parentId);
      if (!parent) {
        return Result.fail(new EntityNotFoundError('Category', input.parentId));
      }
    }

    // 4. Save
    const saved = await this.categoryRepository.save(newCategory);

    return Result.ok({ category: saved });
  }
}
