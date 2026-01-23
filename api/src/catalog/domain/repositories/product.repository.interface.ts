/**
 * =====================================================================
 * PRODUCT REPOSITORY INTERFACE - Port for Product Data Access
 * =====================================================================
 *
 * Clean Architecture: Domain Layer (Port)
 *
 * This interface defines the contract for Product data access.
 * The actual implementation (PrismaProductRepository) lives in Infrastructure layer.
 */

import {
  PaginatedResult,
  PaginationParams,
} from '@core/application/pagination';
import { Product } from '../entities/product.entity';

/**
 * Filter options for product queries
 */
export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isDeleted?: boolean;
  ids?: string[];
}

/**
 * Sort options for product queries
 */
export type ProductSortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'name_asc';

/**
 * Combined query options
 */
export interface ProductQueryOptions extends PaginationParams {
  filter?: ProductFilterOptions;
  sortBy?: ProductSortOption;
  includeDeleted?: boolean;
}

/**
 * Product Repository Interface
 */
export interface IProductRepository {
  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find product by ID or throw
   */
  findByIdOrFail(id: string): Promise<Product>;

  /**
   * Find product by slug within tenant
   */
  findBySlug(tenantId: string, slug: string): Promise<Product | null>;

  /**
   * Check if product exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if slug is unique within tenant
   */
  isSlugUnique(
    tenantId: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Find all products with filtering and pagination
   */
  findAll(
    tenantId: string,
    options: ProductQueryOptions,
  ): Promise<PaginatedResult<Product>>;

  /**
   * Find related products (same category)
   */
  findRelated(
    productId: string,
    categoryIds: string[],
    limit?: number,
  ): Promise<Product[]>;

  /**
   * Count products for tenant
   */
  countByTenant(tenantId: string): Promise<number>;

  /**
   * Save product (create or update)
   */
  save(product: Product): Promise<Product>;

  /**
   * Delete product (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Hard delete product (permanent)
   */
  hardDelete(id: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  findByIds(ids: string[]): Promise<Product[]>;
}

/**
 * Symbol for dependency injection
 */
export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
