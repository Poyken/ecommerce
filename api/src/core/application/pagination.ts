/**
 * =====================================================================
 * PAGINATION - Standardized Paginated Results
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Provides consistent pagination structure across all list queries.
 */

/**
 * Pagination input parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination metadata in response
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Create pagination metadata from query results
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const lastPage = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    lastPage,
    hasNextPage: page < lastPage,
    hasPrevPage: page > 1,
  };
}

/**
 * Create a paginated result
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}

/**
 * Calculate skip value for database query
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 10,
  sortOrder: 'desc',
};

/**
 * Max allowed limit to prevent abuse
 */
export const MAX_PAGINATION_LIMIT = 100;

/**
 * Normalize pagination input (apply defaults and limits)
 */
export function normalizePagination(
  input?: Partial<PaginationParams>,
): PaginationParams {
  const page = Math.max(1, input?.page ?? DEFAULT_PAGINATION.page);
  const limit = Math.min(
    MAX_PAGINATION_LIMIT,
    Math.max(1, input?.limit ?? DEFAULT_PAGINATION.limit),
  );

  return {
    page,
    limit,
    sortBy: input?.sortBy,
    sortOrder: input?.sortOrder ?? DEFAULT_PAGINATION.sortOrder,
  };
}
