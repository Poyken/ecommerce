/**
 * =====================================================================
 * DELETE PRODUCT USE CASE
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Soft deletes a product.
 */

import { CommandUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { EntityNotFoundError } from '@core/domain/errors/domain.error';
import { Inject, Injectable } from '@nestjs/common';

// =====================================================================
// INPUT/OUTPUT DTOs
// =====================================================================

export interface DeleteProductInput {
  productId: string;
  hardDelete?: boolean;
}

export interface DeleteProductOutput {
  success: boolean;
}

export type DeleteProductError = EntityNotFoundError | Error;

// =====================================================================
// USE CASE
// =====================================================================

@Injectable()
export class DeleteProductUseCase extends CommandUseCase<
  DeleteProductInput,
  DeleteProductOutput,
  DeleteProductError
> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {
    super();
  }

  async execute(
    input: DeleteProductInput,
  ): Promise<Result<DeleteProductOutput, DeleteProductError>> {
    try {
      // 1. Check if product exists
      const exists = await this.productRepository.exists(input.productId);
      if (!exists) {
        return Result.fail(new EntityNotFoundError('Product', input.productId));
      }

      // 2. Delete product
      if (input.hardDelete) {
        await this.productRepository.hardDelete(input.productId);
      } else {
        await this.productRepository.delete(input.productId);
      }

      return Result.ok({ success: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
