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

export interface UpdateCategoryInput {
  id: string;
  tenantId: string;
  name?: string;
  slug?: string;
  imageUrl?: string;
  parentId?: string | null; // null to remove parent
}

export type UpdateCategoryOutput = { category: Category };
export type UpdateCategoryError =
  | BusinessRuleViolationError
  | EntityNotFoundError;

@Injectable()
export class UpdateCategoryUseCase extends CommandUseCase<
  UpdateCategoryInput,
  UpdateCategoryOutput,
  UpdateCategoryError
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(
    input: UpdateCategoryInput,
  ): Promise<Result<UpdateCategoryOutput, UpdateCategoryError>> {
    const category = await this.categoryRepository.findById(input.id);
    if (!category || category.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Category', input.id));
    }

    if (input.name) category.updateInfo({ name: input.name });
    if (input.imageUrl !== undefined)
      category.updateInfo({ imageUrl: input.imageUrl });

    // Handle Parent
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        category.moveToParent(undefined);
      } else {
        const parent = await this.categoryRepository.findById(input.parentId);
        if (!parent || parent.tenantId !== input.tenantId) {
          return Result.fail(
            new EntityNotFoundError('Category', input.parentId),
          );
        }
        category.moveToParent(input.parentId);
      }
    }

    // Check Uniqueness
    const isUnique = await this.categoryRepository.isSlugUnique(
      input.tenantId,
      category.slug.value,
      category.id,
    );
    if (!isUnique) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Category slug '${category.slug.value}' already exists`,
        ),
      );
    }

    const saved = await this.categoryRepository.save(category);
    return Result.ok({ category: saved });
  }
}
