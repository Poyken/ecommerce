/**
 * =====================================================================
 * SKU REPOSITORY INTERFACE - Port for SKU Data Access
 * =====================================================================
 */

import {
  PaginatedResult,
  PaginationParams,
} from '@core/application/pagination';
import { Sku, SkuStatus } from '../entities/sku.entity';

/**
 * SKU query options
 */
export interface SkuQueryOptions extends PaginationParams {
  productId?: string;
  status?: SkuStatus;
  inStock?: boolean;
  search?: string;
  stockLimit?: number;
}

/**
 * Stock update payload
 */
export interface StockUpdate {
  skuId: string;
  quantity: number;
  operation: 'add' | 'remove' | 'set';
}

/**
 * SKU Repository Interface
 */
export abstract class ISkuRepository {
  /**
   * Find SKU by ID
   */
  abstract findById(id: string): Promise<Sku | null>;

  /**
   * Find SKU by ID or throw
   */
  abstract findByIdOrFail(id: string): Promise<Sku>;

  /**
   * Find SKU by code within tenant
   */
  abstract findByCode(tenantId: string, skuCode: string): Promise<Sku | null>;

  /**
   * Check if SKU exists
   */
  abstract exists(id: string): Promise<boolean>;

  /**
   * Check if SKU code is unique within tenant
   */
  abstract isCodeUnique(
    tenantId: string,
    skuCode: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Find all SKUs for a product
   */
  abstract findByProduct(productId: string, status?: SkuStatus): Promise<Sku[]>;

  /**
   * Find all SKUs with filtering
   */
  abstract findAll(
    tenantId: string,
    options?: SkuQueryOptions,
  ): Promise<PaginatedResult<Sku>>;

  /**
   * Find SKUs with low stock
   */
  abstract findLowStock(tenantId: string, threshold: number): Promise<Sku[]>;

  /**
   * Count SKUs for product
   */
  abstract countByProduct(productId: string): Promise<number>;

  /**
   * Save SKU
   */
  abstract save(sku: Sku): Promise<Sku>;

  /**
   * Batch save SKUs
   */
  abstract saveMany(skus: Sku[]): Promise<Sku[]>;

  /**
   * Delete SKU
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Delete all SKUs for a product
   */
  abstract deleteByProduct(productId: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  abstract findByIds(ids: string[]): Promise<Sku[]>;

  /**
   * Update stock in batch
   */
  abstract updateStockBatch(updates: StockUpdate[]): Promise<void>;

  /**
   * Reserve stock for order
   */
  abstract reserveStock(skuId: string, quantity: number): Promise<void>;

  /**
   * Release reserved stock
   */
  abstract releaseStock(skuId: string, quantity: number): Promise<void>;
}

/**
 * Symbol for dependency injection
 */
export const SKU_REPOSITORY = Symbol('ISkuRepository');
