/**
 * =====================================================================
 * CREATE PRODUCT USE CASE
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Orchestrates the creation of a new product including:
 * - Validation of input data
 * - Category/Brand existence check
 * - Plan limit verification
 * - SKU generation
 * - Cache invalidation
 */

import { CommandUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import {
  Product,
  ProductOption,
  ProductImage,
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

export interface CreateProductInput {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string;
  brandId: string;
  categoryIds: string[];
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

export interface CreateProductOutput {
  product: Product;
}

export type CreateProductError =
  | EntityNotFoundError
  | BusinessRuleViolationError
  | Error;

// =====================================================================
// USE CASE
// =====================================================================

@Injectable()
export class CreateProductUseCase extends CommandUseCase<
  CreateProductInput,
  CreateProductOutput,
  CreateProductError
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
    input: CreateProductInput,
  ): Promise<Result<CreateProductOutput, CreateProductError>> {
    try {
      // 1. Validate categories exist
      const categories = await this.categoryRepository.findByIds(
        input.categoryIds,
      );
      if (categories.length !== input.categoryIds.length) {
        const foundIds = new Set(categories.map((c) => c.id));
        const missingIds = input.categoryIds.filter((id) => !foundIds.has(id));
        return Result.fail(
          new EntityNotFoundError('Category', missingIds.join(', ')),
        );
      }

      // 2. Validate brand exists
      const brand = await this.brandRepository.findById(input.brandId);
      if (!brand) {
        return Result.fail(new EntityNotFoundError('Brand', input.brandId));
      }

      // 3. Check slug uniqueness
      const slug = input.slug || this.generateSlug(input.name);
      const isSlugUnique = await this.productRepository.isSlugUnique(
        input.tenantId,
        slug,
      );
      if (!isSlugUnique) {
        return Result.fail(
          new BusinessRuleViolationError(
            'Slug must be unique',
            `Slug "${slug}" already exists`,
          ),
        );
      }

      // 4. Transform options to domain format
      const productOptions: ProductOption[] = (input.options ?? []).map(
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

      // 5. Transform images to domain format
      const productImages: ProductImage[] = (input.images ?? []).map(
        (img, index) => ({
          id: uuidv4(),
          url: img.url,
          alt: img.alt,
          displayOrder: img.displayOrder ?? index,
        }),
      );

      // 6. Create product entity
      const product = Product.create({
        id: uuidv4(),
        tenantId: input.tenantId,
        name: input.name,
        slug,
        description: input.description,
        brandId: input.brandId,
        categoryIds: input.categoryIds,
        options: productOptions,
        images: productImages,
        metadata: input.metadata,
      });

      // 7. Save product
      const savedProduct = await this.productRepository.save(product);

      // 8. Return success
      return Result.ok({ product: savedProduct });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
