/**
 * =====================================================================
 * REPOSITORY INTERFACE - Port for Data Access
 * =====================================================================
 *
 * Clean Architecture: Application Layer (Port)
 *
 * Repository interfaces define the contract for data access.
 * The actual implementation lives in the Infrastructure layer.
 *
 * This allows:
 * 1. Domain/Application layers to be independent of data source
 * 2. Easy testing with mock repositories
 * 3. Swappable persistence (Prisma -> TypeORM, etc.)
 */

import { PaginatedResult, PaginationParams } from './pagination';

/**
 * Base repository interface for all entities
 */
export interface IRepository<TEntity, TId = string> {
  /**
   * Find entity by ID
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * Find entity by ID or throw
   */
  findByIdOrFail(id: TId): Promise<TEntity>;

  /**
   * Check if entity exists
   */
  exists(id: TId): Promise<boolean>;

  /**
   * Save entity (create or update)
   */
  save(entity: TEntity): Promise<TEntity>;

  /**
   * Delete entity by ID
   */
  delete(id: TId): Promise<void>;
}

/**
 * Extended repository with list operations
 */
export interface IListableRepository<TEntity, TId = string> extends IRepository<
  TEntity,
  TId
> {
  /**
   * Find all entities (with pagination)
   */
  findAll(params: PaginationParams): Promise<PaginatedResult<TEntity>>;

  /**
   * Count all entities
   */
  count(): Promise<number>;
}

/**
 * Repository with tenant isolation
 */
export interface ITenantRepository<
  TEntity,
  TId = string,
> extends IListableRepository<TEntity, TId> {
  /**
   * Find all entities for a specific tenant
   */
  findAllByTenant(
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<TEntity>>;

  /**
   * Find entity by ID within tenant context
   */
  findByIdInTenant(id: TId, tenantId: string): Promise<TEntity | null>;
}

/**
 * Unit of Work pattern for transactional operations
 */
export interface IUnitOfWork {
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute a function within a transaction
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
