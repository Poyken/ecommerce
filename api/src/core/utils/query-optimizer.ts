/**
 * =====================================================================
 * QUERY OPTIMIZATION UTILITIES
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Các utilities này giúp tối ưu hóa database queries:
 * 1. Batching: Gom nhiều queries thành một
 * 2. DataLoader: Giải quyết N+1 problem
 * 3. Query analyzer: Phân tích và cảnh báo slow queries
 *
 * =====================================================================
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('QueryOptimizer');

/**
 * Generic batch loader - Gom nhiều request thành một query
 * Giải quyết N+1 problem hiệu quả
 */
export class BatchLoader<K, V> {
  private batch: K[] = [];
  private scheduled = false;
  private pendingResolvers: Map<
    K,
    { resolve: (value: V | null) => void; reject: (error: Error) => void }[]
  > = new Map();

  constructor(
    private readonly batchFn: (keys: K[]) => Promise<Map<K, V>>,
    private readonly options: { maxBatchSize?: number; delayMs?: number } = {},
  ) {}

  async load(key: K): Promise<V | null> {
    return new Promise((resolve, reject) => {
      // Add to pending resolvers
      const existing = this.pendingResolvers.get(key) || [];
      existing.push({ resolve, reject });
      this.pendingResolvers.set(key, existing);

      // Add key to batch if not already present
      if (!this.batch.includes(key)) {
        this.batch.push(key);
      }

      // Schedule batch execution
      if (!this.scheduled) {
        this.scheduled = true;
        setTimeout(() => this.executeBatch(), this.options.delayMs ?? 10);
      }

      // Execute immediately if batch is full
      const maxSize = this.options.maxBatchSize ?? 100;
      if (this.batch.length >= maxSize) {
        this.executeBatch();
      }
    });
  }

  private async executeBatch() {
    const keys = [...this.batch];
    const resolvers = new Map(this.pendingResolvers);

    // Reset state
    this.batch = [];
    this.pendingResolvers.clear();
    this.scheduled = false;

    try {
      // Execute batch function
      const results = await this.batchFn(keys);

      // Resolve all pending promises
      for (const [key, callbacks] of resolvers) {
        const value = results.get(key) ?? null;
        for (const { resolve } of callbacks) {
          resolve(value);
        }
      }
    } catch (error) {
      // Reject all pending promises
      for (const callbacks of resolvers.values()) {
        for (const { reject } of callbacks) {
          reject(error as Error);
        }
      }
    }
  }

  // Clear all pending requests
  clear() {
    this.batch = [];
    this.pendingResolvers.clear();
    this.scheduled = false;
  }
}

/**
 * Create common batch loaders for entities
 */
export function createEntityLoader<T extends { id: string }>(
  findMany: (ids: string[]) => Promise<T[]>,
): BatchLoader<string, T> {
  return new BatchLoader(async (ids: string[]) => {
    const entities = await findMany(ids);
    return new Map(entities.map((e) => [e.id, e]));
  });
}

/**
 * Query builder helper - Tạo điều kiện where an toàn
 */
export class WhereBuilder {
  private conditions: Record<string, any> = {};

  eq(field: string, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions[field] = value;
    }
    return this;
  }

  in(field: string, values: any[]): this {
    if (values && values.length > 0) {
      this.conditions[field] = { in: values };
    }
    return this;
  }

  contains(field: string, value: string, caseInsensitive = true): this {
    if (value) {
      this.conditions[field] = {
        contains: value,
        mode: caseInsensitive ? 'insensitive' : undefined,
      };
    }
    return this;
  }

  gt(field: string, value: number | Date): this {
    if (value !== undefined) {
      this.conditions[field] = { ...this.conditions[field], gt: value };
    }
    return this;
  }

  gte(field: string, value: number | Date): this {
    if (value !== undefined) {
      this.conditions[field] = { ...this.conditions[field], gte: value };
    }
    return this;
  }

  lt(field: string, value: number | Date): this {
    if (value !== undefined) {
      this.conditions[field] = { ...this.conditions[field], lt: value };
    }
    return this;
  }

  lte(field: string, value: number | Date): this {
    if (value !== undefined) {
      this.conditions[field] = { ...this.conditions[field], lte: value };
    }
    return this;
  }

  between(field: string, min?: number | Date, max?: number | Date): this {
    if (min !== undefined) this.gte(field, min);
    if (max !== undefined) this.lte(field, max);
    return this;
  }

  or(conditions: Record<string, any>[]): this {
    if (conditions.length > 0) {
      this.conditions['OR'] = conditions;
    }
    return this;
  }

  and(conditions: Record<string, any>[]): this {
    if (conditions.length > 0) {
      this.conditions['AND'] = conditions;
    }
    return this;
  }

  notDeleted(): this {
    this.conditions['deletedAt'] = null;
    return this;
  }

  build(): Record<string, any> {
    return { ...this.conditions };
  }
}

/**
 * Select builder - Xây dựng select fields an toàn
 */
export class SelectBuilder {
  private fields: Record<string, boolean | Record<string, any>> = {};

  add(...fieldNames: string[]): this {
    for (const field of fieldNames) {
      this.fields[field] = true;
    }
    return this;
  }

  include(field: string, options?: Record<string, any>): this {
    this.fields[field] = options ?? true;
    return this;
  }

  nested(field: string, select: Record<string, any>): this {
    this.fields[field] = { select };
    return this;
  }

  build(): Record<string, any> {
    return { ...this.fields };
  }
}

/**
 * OrderBy builder
 */
export class OrderByBuilder {
  private orderBy: Record<string, 'asc' | 'desc'>[] = [];

  add(field: string, direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy.push({ [field]: direction });
    return this;
  }

  fromString(sortString?: string): this {
    if (!sortString) return this;

    const parts = sortString.split('_');
    if (parts.length === 2) {
      const [field, dir] = parts;
      this.add(field, dir === 'asc' ? 'asc' : 'desc');
    }
    return this;
  }

  build(): Record<string, 'asc' | 'desc'>[] {
    return this.orderBy.length > 0 ? this.orderBy : [{ createdAt: 'desc' }];
  }
}

/**
 * Query analyzer - Phân tích và log slow queries
 */
export function analyzeQuery(
  queryName: string,
  duration: number,
  rowCount: number,
) {
  const SLOW_THRESHOLD = 100; // ms
  const LARGE_RESULT_THRESHOLD = 1000;

  if (duration > SLOW_THRESHOLD) {
    logger.warn(
      `⚠️ SLOW QUERY: ${queryName} took ${duration.toFixed(0)}ms (returned ${rowCount} rows)`,
    );
  }

  if (rowCount > LARGE_RESULT_THRESHOLD) {
    logger.warn(
      `⚠️ LARGE RESULT: ${queryName} returned ${rowCount} rows - consider pagination`,
    );
  }
}
