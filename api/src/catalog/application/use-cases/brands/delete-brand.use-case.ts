import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../../domain/repositories/brand.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';

export interface DeleteBrandInput {
  id: string;
  tenantId: string;
}

export type DeleteBrandOutput = void;
export type DeleteBrandError = BusinessRuleViolationError | EntityNotFoundError;

@Injectable()
export class DeleteBrandUseCase extends CommandUseCase<
  DeleteBrandInput,
  DeleteBrandOutput,
  DeleteBrandError
> {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {
    super();
  }

  async execute(
    input: DeleteBrandInput,
  ): Promise<Result<DeleteBrandOutput, DeleteBrandError>> {
    const { id, tenantId } = input;

    // 1. Check existence
    const brand = await this.brandRepository.findById(id);
    if (!brand || brand.tenantId !== tenantId) {
      return Result.fail(new EntityNotFoundError('Brand', id));
    }

    // 2. Check products
    const productsResult = await this.productRepository.findAll(tenantId, {
      filter: { brandId: id },
      limit: 1,
      page: 1,
    });

    if (productsResult.data.length > 0) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Cannot delete brand with associated products.',
        ),
      );
    }

    // 3. Delete
    await this.brandRepository.delete(id);

    return Result.ok(undefined);
  }
}
