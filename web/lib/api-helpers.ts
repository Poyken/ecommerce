/**
 * API Helpers - Pagination and query utilities
 */

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Normalize pagination parameters for API requests.
 * Handles both object-style and positional arguments.
 */
export function normalizePaginationParams(
  paramsOrPage?: number | PaginationParams,
  limit?: number,
  search?: string
): Record<string, string | number | boolean | undefined> {
  // If first argument is an object, use its properties
  if (typeof paramsOrPage === "object" && paramsOrPage !== null) {
    return {
      page: paramsOrPage.page || 1,
      limit: paramsOrPage.limit || 10,
      search: paramsOrPage.search || undefined,
    };
  }

  // Otherwise, treat as positional arguments
  return {
    page: paramsOrPage || 1,
    limit: limit || 10,
    search: search || undefined,
  };
}
