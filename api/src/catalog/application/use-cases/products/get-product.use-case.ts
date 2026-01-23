/**
 * =====================================================================
 * GET PRODUCT USE CASE
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Retrieves a single product by ID with caching support.
 */

import { QueryUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { Product } from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { EntityNotFoundError } from '@core/domain/errors/domain.error';
import { Inject, Injectable } from '@nestjs/common';

// =====================================================================
// INPUT/OUTPUT DTOs
// =====================================================================

export interface GetProductInput {
  productId: string;
  includeDeleted?: boolean;
}

export interface GetProductOutput {
  product: Product;
}

export type GetProductError = EntityNotFoundError | Error;

// =====================================================================
// USE CASE
// =====================================================================

@Injectable()
export class GetProductUseCase extends QueryUseCase<
  GetProductInput,
  GetProductOutput,
  GetProductError
> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {
    super();
  }

  async execute(
    input: GetProductInput,
  ): Promise<Result<GetProductOutput, GetProductError>> {
    try {
      const product = await this.productRepository.findById(input.productId);

      if (!product) {
        return Result.fail(new EntityNotFoundError('Product', input.productId));
      }

      // Check if deleted and caller doesn't want deleted
      if (product.isDeleted && !input.includeDeleted) {
        return Result.fail(new EntityNotFoundError('Product', input.productId));
      }

      return Result.ok({ product });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
