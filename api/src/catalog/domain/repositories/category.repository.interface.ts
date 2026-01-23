/**
 * =====================================================================
 * CATEGORY REPOSITORY INTERFACE - Port for Category Data Access
 * =====================================================================
 */

import {
  PaginatedResult,
  PaginationParams,
} from '@core/application/pagination';
import { Category } from '../entities/category.entity';

/**
 * Category query options
 */
export interface CategoryQueryOptions extends PaginationParams {
  parentId?: string | null; // null = root categories only
  isActive?: boolean;
  search?: string;
}

/**
 * Category Repository Interface
 */
export abstract class ICategoryRepository {
  /**
   * Find category by ID
   */
  abstract findById(id: string): Promise<Category | null>;

  /**
   * Find category by ID or throw
   */
  abstract findByIdOrFail(id: string): Promise<Category>;

  /**
   * Find category by slug within tenant
   */
  abstract findBySlug(tenantId: string, slug: string): Promise<Category | null>;

  /**
   * Check if category exists
   */
  abstract exists(id: string): Promise<boolean>;

  /**
   * Check if slug is unique within tenant
   */
  abstract isSlugUnique(
    tenantId: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Find all categories with filtering
   */
  abstract findAll(
    tenantId: string,
    options?: CategoryQueryOptions,
  ): Promise<PaginatedResult<Category>>;

  /**
   * Find root categories (no parent)
   */
  abstract findRoots(tenantId: string): Promise<Category[]>;

  /**
   * Find children of a category
   */
  abstract findChildren(parentId: string): Promise<Category[]>;

  /**
   * Find full category tree
   */
  abstract findTree(tenantId: string): Promise<Category[]>;

  /**
   * Get ancestor chain (path from root to category)
   */
  abstract findAncestors(categoryId: string): Promise<Category[]>;

  /**
   * Count categories for tenant
   */
  abstract countByTenant(tenantId: string): Promise<number>;

  /**
   * Save category
   */
  abstract save(category: Category): Promise<Category>;

  /**
   * Delete category
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  abstract findByIds(ids: string[]): Promise<Category[]>;
}

/**
 * Symbol for dependency injection
 */
export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');
