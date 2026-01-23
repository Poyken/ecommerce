/**
 * =====================================================================
 * UPDATE PRODUCT USE CASE
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Updates an existing product with validation.
 */

import { CommandUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import {
  Product,
  ProductImage,
  ProductOption,
} from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../../domain/repositories/category.repository.interface';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../../domain/repositories/brand.repository.interface';
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from '@core/domain/errors/domain.error';
import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// =====================================================================
// INPUT/OUTPUT DTOs
// =====================================================================

export interface UpdateProductInput {
  productId: string;
  name?: string;
  description?: string;
  brandId?: string;
  categoryIds?: string[];
  options?: Array<{
    name: string;
    values: string[];
  }>;
  images?: Array<{
    url: string;
    alt?: string;
    displayOrder?: number;
  }>;
  metadata?: Record<string, unknown>;
}

export interface UpdateProductOutput {
  product: Product;
}

export type UpdateProductError =
  | EntityNotFoundError
  | BusinessRuleViolationError
  | Error;

// =====================================================================
// USE CASE
// =====================================================================

@Injectable()
export class UpdateProductUseCase extends CommandUseCase<
  UpdateProductInput,
  UpdateProductOutput,
  UpdateProductError
> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {
    super();
  }

  async execute(
    input: UpdateProductInput,
  ): Promise<Result<UpdateProductOutput, UpdateProductError>> {
    try {
      // 1. Find existing product
      const product = await this.productRepository.findById(input.productId);
      if (!product) {
        return Result.fail(new EntityNotFoundError('Product', input.productId));
      }

      // 2. Validate categories if provided
      if (input.categoryIds) {
        const categories = await this.categoryRepository.findByIds(
          input.categoryIds,
        );
        if (categories.length !== input.categoryIds.length) {
          return Result.fail(
            new EntityNotFoundError(
              'Category',
              'One or more categories not found',
            ),
          );
        }
      }

      // 3. Validate brand if provided
      if (input.brandId) {
        const brand = await this.brandRepository.findById(input.brandId);
        if (!brand) {
          return Result.fail(new EntityNotFoundError('Brand', input.brandId));
        }
      }

      // 4. Update basic info
      product.updateInfo({
        name: input.name,
        description: input.description,
        brandId: input.brandId,
        categoryIds: input.categoryIds,
        metadata: input.metadata,
      });

      // 5. Update options if provided
      if (input.options) {
        const productOptions: ProductOption[] = input.options.map(
          (opt, index) => ({
            id: uuidv4(),
            name: opt.name,
            displayOrder: index,
            values: opt.values.map((val) => ({
              id: uuidv4(),
              value: val,
            })),
          }),
        );
        product.setOptions(productOptions);
      }

      // 6. Update images if provided
      if (input.images) {
        const productImages: ProductImage[] = input.images.map(
          (img, index) => ({
            id: uuidv4(),
            url: img.url,
            alt: img.alt,
            displayOrder: img.displayOrder ?? index,
          }),
        );
        product.setImages(productImages);
      }

      // 7. Save product
      const savedProduct = await this.productRepository.save(product);

      return Result.ok({ product: savedProduct });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
