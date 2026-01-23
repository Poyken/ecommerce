/**
 * =====================================================================
 * LIST PRODUCTS USE CASE
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Lists products with filtering, sorting, and pagination.
 */

import { QueryUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { PaginatedResult } from '@core/application/pagination';
import { Product } from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
  ProductQueryOptions,
  ProductSortOption,
} from '../../../domain/repositories/product.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

// =====================================================================
// INPUT/OUTPUT DTOs
// =====================================================================

export interface ListProductsInput {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortOption;
  ids?: string[];
}

export interface ListProductsOutput {
  products: PaginatedResult<Product>;
}

export type ListProductsError = Error;

// =====================================================================
// USE CASE
// =====================================================================

@Injectable()
export class ListProductsUseCase extends QueryUseCase<
  ListProductsInput,
  ListProductsOutput,
  ListProductsError
> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {
    super();
  }

  async execute(
    input: ListProductsInput,
  ): Promise<Result<ListProductsOutput, ListProductsError>> {
    try {
      const queryOptions: ProductQueryOptions = {
        page: input.page ?? 1,
        limit: Math.min(input.limit ?? 10, 100), // Cap at 100
        sortBy: input.sortBy,
        filter: {
          search: input.search,
          categoryId: input.categoryId,
          brandId: input.brandId,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          ids: input.ids,
          isDeleted: false, // Default: exclude deleted
        },
      };

      const products = await this.productRepository.findAll(
        input.tenantId,
        queryOptions,
      );

      return Result.ok({ products });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
