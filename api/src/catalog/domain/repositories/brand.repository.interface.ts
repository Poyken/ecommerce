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
  isActive?: boolean;
  search?: string;
}

/**
 * Brand Repository Interface
 */
export interface IBrandRepository {
  /**
   * Find brand by ID
   */
  findById(id: string): Promise<Brand | null>;

  /**
   * Find brand by ID or throw
   */
  findByIdOrFail(id: string): Promise<Brand>;

  /**
   * Find brand by slug within tenant
   */
  findBySlug(tenantId: string, slug: string): Promise<Brand | null>;

  /**
   * Check if brand exists
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
   * Find all brands with filtering
   */
  findAll(
    tenantId: string,
    options?: BrandQueryOptions,
  ): Promise<PaginatedResult<Brand>>;

  /**
   * Find active brands
   */
  findActive(tenantId: string): Promise<Brand[]>;

  /**
   * Count brands for tenant
   */
  countByTenant(tenantId: string): Promise<number>;

  /**
   * Save brand
   */
  save(brand: Brand): Promise<Brand>;

  /**
   * Delete brand
   */
  delete(id: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  findByIds(ids: string[]): Promise<Brand[]>;
}

/**
 * Symbol for dependency injection
 */
export const BRAND_REPOSITORY = Symbol('IBrandRepository');
