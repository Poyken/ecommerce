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
export interface ISkuRepository {
  /**
   * Find SKU by ID
   */
  findById(id: string): Promise<Sku | null>;

  /**
   * Find SKU by ID or throw
   */
  findByIdOrFail(id: string): Promise<Sku>;

  /**
   * Find SKU by code within tenant
   */
  findByCode(tenantId: string, skuCode: string): Promise<Sku | null>;

  /**
   * Check if SKU exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if SKU code is unique within tenant
   */
  isCodeUnique(
    tenantId: string,
    skuCode: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Find all SKUs for a product
   */
  findByProduct(productId: string, status?: SkuStatus): Promise<Sku[]>;

  /**
   * Find all SKUs with filtering
   */
  findAll(
    tenantId: string,
    options?: SkuQueryOptions,
  ): Promise<PaginatedResult<Sku>>;

  /**
   * Find SKUs with low stock
   */
  findLowStock(tenantId: string, threshold: number): Promise<Sku[]>;

  /**
   * Count SKUs for product
   */
  countByProduct(productId: string): Promise<number>;

  /**
   * Save SKU
   */
  save(sku: Sku): Promise<Sku>;

  /**
   * Batch save SKUs
   */
  saveMany(skus: Sku[]): Promise<Sku[]>;

  /**
   * Delete SKU
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all SKUs for a product
   */
  deleteByProduct(productId: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  findByIds(ids: string[]): Promise<Sku[]>;

  /**
   * Update stock in batch
   */
  updateStockBatch(updates: StockUpdate[]): Promise<void>;

  /**
   * Reserve stock for order
   */
  reserveStock(skuId: string, quantity: number): Promise<void>;

  /**
   * Release reserved stock
   */
  releaseStock(skuId: string, quantity: number): Promise<void>;
}

/**
 * Symbol for dependency injection
 */
export const SKU_REPOSITORY = Symbol('ISkuRepository');
