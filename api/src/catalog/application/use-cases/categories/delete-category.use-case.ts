import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../../domain/repositories/category.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';

export interface DeleteCategoryInput {
  id: string;
  tenantId: string;
}

export type DeleteCategoryOutput = void;
export type DeleteCategoryError =
  | BusinessRuleViolationError
  | EntityNotFoundError;

@Injectable()
export class DeleteCategoryUseCase extends CommandUseCase<
  DeleteCategoryInput,
  DeleteCategoryOutput,
  DeleteCategoryError
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {
    super();
  }

  async execute(
    input: DeleteCategoryInput,
  ): Promise<Result<DeleteCategoryOutput, DeleteCategoryError>> {
    const { id, tenantId } = input;

    // 1. Check existence
    const category = await this.categoryRepository.findById(id);
    if (!category || category.tenantId !== tenantId) {
      return Result.fail(new EntityNotFoundError('Category', id));
    }

    // 2. Check children
    const children = await this.categoryRepository.findChildren(id);
    if (children.length > 0) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Cannot delete category with children. Move or delete children first.',
        ),
      );
    }

    // 3. Check products
    const productsResult = await this.productRepository.findAll(tenantId, {
      filter: { categoryId: id },
      limit: 1,
      page: 1,
    });

    if (productsResult.data.length > 0) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Cannot delete category with associated products.',
        ),
      );
    }

    // 4. Delete
    await this.categoryRepository.delete(id);

    return Result.ok(undefined);
  }
}
