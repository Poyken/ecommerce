/**
 * =====================================================================
 * CATALOG PROVIDERS - Dependency Injection Configuration
 * =====================================================================
 *
 * Clean Architecture: Wire up repository interfaces to implementations.
 * This file registers all domain ports with their infrastructure adapters.
 */

import { Provider } from '@nestjs/common';

// Repository Tokens (Symbols from domain layer)
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';
import { BRAND_REPOSITORY } from './domain/repositories/brand.repository.interface';

// Repository Implementations (from infrastructure layer)
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { PrismaBrandRepository } from './infrastructure/repositories/prisma-brand.repository';

// Use Cases
import {
  CreateProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
} from './application/use-cases/products';

/**
 * Repository Providers - Maps interfaces to implementations
 */
export const repositoryProviders: Provider[] = [
  {
    provide: PRODUCT_REPOSITORY,
    useClass: PrismaProductRepository,
  },
  {
    provide: CATEGORY_REPOSITORY,
    useClass: PrismaCategoryRepository,
  },
  {
    provide: BRAND_REPOSITORY,
    useClass: PrismaBrandRepository,
  },
];

/**
 * Use Case Providers - Registers all use cases
 */
export const useCaseProviders: Provider[] = [
  CreateProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
];

/**
 * All Catalog Providers
 */
export const catalogProviders: Provider[] = [
  ...repositoryProviders,
  ...useCaseProviders,
];
