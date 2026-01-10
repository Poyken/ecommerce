/**
 * =====================================================================
 * API BASE TYPES
 * =====================================================================
 */

/**
 * Metadata cho các API có phân trang.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
}

/**
 * Wrapper chuẩn cho tất cả API SUCCESS responses.
 * statusCode và message là bắt buộc từ Interceptor.
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Wrapper cho API ERROR responses (thô từ server).
 */
export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[] | Record<string, unknown>;
}

/**
 * Cấu trúc lỗi API dùng trong ứng dụng.
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Kết quả trả về từ Server Actions (Simplified).
 */
export type ActionResult<T = void> =
  | { success: true; data?: T; meta?: PaginationMeta; error?: never }
  | { success?: false; error: string; data?: never; meta?: never };

/**
 * Paginated data wrapper.
 */
export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Common list parameters.
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: any;
}
