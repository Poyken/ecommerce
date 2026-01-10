/**
 * =====================================================================
 * RESPONSE HELPER - Chuẩn hóa Response Format
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONSISTENT RESPONSE FORMAT:
 * - Tất cả API trả về cùng một format: { success, data, message, meta }
 * - Frontend dễ xử lý hơn vì biết chắc cấu trúc response.
 *
 * 2. TYPE SAFETY:
 * - Generic types giúp TypeScript hiểu đúng kiểu dữ liệu.
 * =====================================================================
 */

/**
 * Standard API response structure.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

/**
 * Pagination metadata.
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
 * Tạo success response.
 */
export function success<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Tạo paginated response.
 */
export function paginated<T>(
  data: T[],
  meta: PaginationMeta,
  message?: string,
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta,
    message,
  };
}

/**
 * Tạo error response (thường throw Exception thay vì trả về này).
 */
export function error(message: string, data?: unknown): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
  };
}

/**
 * Helper để wrap kết quả từ Prisma với pagination.
 */
export function wrapWithPagination<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  const lastPage = Math.ceil(total / limit);

  return paginated(items, {
    total,
    page,
    limit,
    lastPage,
    hasPrevPage: page > 1,
    hasNextPage: page < lastPage,
  });
}

/**
 * Standard messages.
 */
export const MESSAGES = {
  CREATED: 'Tạo thành công',
  UPDATED: 'Cập nhật thành công',
  DELETED: 'Xóa thành công',
  FETCHED: 'Lấy dữ liệu thành công',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  UNAUTHORIZED: 'Bạn chưa đăng nhập',
  FORBIDDEN: 'Bạn không có quyền truy cập',
} as const;
