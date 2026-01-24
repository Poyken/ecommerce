/**
 * =====================================================================
 * BRAND REPOSITORY INTERFACE - Port for Brand Data Access
 * =====================================================================
 */

import {
  PaginatedResult,
  PaginationParams,
} from '@core/application/pagination';
import { Brand } from '../entities/brand.entity';

/**
 * Brand query options
 */
export interface BrandQueryOptions extends PaginationParams {
  search?: string;
}

/**
 * Brand Repository Interface
 */
export abstract class IBrandRepository {
  /**
   * Find brand by ID
   */
  abstract findById(id: string): Promise<Brand | null>;

  /**
   * Find brand by ID or throw
   */
  abstract findByIdOrFail(id: string): Promise<Brand>;

  /**
   * Find brand by slug within tenant
   */
  abstract findBySlug(tenantId: string, slug: string): Promise<Brand | null>;

  /**
   * Check if brand exists
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
   * Find all brands with filtering
   */
  abstract findAll(
    tenantId: string,
    options?: BrandQueryOptions,
  ): Promise<PaginatedResult<Brand>>;

  /**
   * Count brands for tenant
   */
  abstract countByTenant(tenantId: string): Promise<number>;

  /**
   * Save brand
   */
  abstract save(brand: Brand): Promise<Brand>;

  /**
   * Delete brand
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  abstract findByIds(ids: string[]): Promise<Brand[]>;
}

/**
 * Symbol for dependency injection
 */
export const BRAND_REPOSITORY = Symbol('IBrandRepository');
