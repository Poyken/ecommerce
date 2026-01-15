/**
 * =====================================================================
 * API BASE TYPES - Định nghĩa các kiểu dữ liệu phản hồi từ API
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - File này chứa các interface/type định nghĩa cấu trúc dữ liệu JSON mà Backend trả về.
 * - Giúp Frontend (Web) hiểu và có Type Safety khi gọi API.
 *
 * 2. CÁC TYPE QUAN TRỌNG:
 * - `ApiResponse<T>`: Wrapper chuẩn cho mọi response thành công (`statusCode`, `message`, `data`).
 * - `PaginationMeta`: Thông tin phân trang (tổng số trang, trang hiện tại...).
 * - `ApiError`: Cấu trúc lỗi chuẩn để hiển thị thông báo lỗi đồng nhất.
 *
 * 3. LƯU Ý:
 * - Luôn sử dụng `ApiResponse<MyDataType>` khi define kiểu trả về của hook hoặc service gọi API. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Standardization: Tạo ra một "ngôn ngữ chung" cho toàn bộ Services và Hooks trong Web, giúp việc xử lý lỗi và phân trang trở nên đồng nhất.
 * - DX (Developer Experience): Giúp lập trình viên biết ngay cấu trúc Meta (total, page) để code UI phân trang chỉ trong vài giây.

 * =====================================================================
 */
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
