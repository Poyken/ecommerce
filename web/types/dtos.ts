/**
 * =====================================================================
 * DATA TRANSFER OBJECTS (DTOs) & TYPE DEFINITIONS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DTO (Data Transfer Object) là các interface TypeScript định nghĩa
 * cấu trúc dữ liệu được truyền giữa Client và Server (qua API).
 *
 * LỢI ÍCH CỦA DTO:
 * 1. Validation: Backend dùng DTO để validate dữ liệu đầu vào (dùng `class-validator`).
 * 2. Security: Chỉ cho phép các trường được định nghĩa đi qua (whitelist).
 * 3. Clarity: Frontend biết chính xác cần gửi gì và nhận gì.
 *
 * QUY ƯỚC ĐẶT TÊN:
 * - `CreateXxxDto`: Dữ liệu để tạo mới (thường bắt buộc nhiều field).
 * - `UpdateXxxDto`: Dữ liệu để cập nhật (thường optional `?` tất cả).
 * - `XxxResponse`: Cấu trúc dữ liệu trả về từ API (thường bọc trong `ApiResponse`).
 * =====================================================================
 */

// ==================== API RESPONSE WRAPPERS ====================

/**
 * Wrapper chuẩn cho tất cả API SUCCESS responses.
 * Backend NestJS TransformInterceptor wrap response trong cấu trúc này.
 *
 * @template T - Kiểu dữ liệu thực của response
 */
export interface ApiResponse<T> {
  /** HTTP Status Code (200, 201, etc.) */
  statusCode: number;
  /** Thông báo (mặc định: "Success") */
  message: string;
  /** Dữ liệu chính của response */
  data: T;
  /** Metadata phân trang (nếu có) */
  meta?: PaginationMeta;
}

/**
 * Wrapper cho API ERROR responses.
 * Backend NestJS AllExceptionsFilter trả về cấu trúc này khi có lỗi.
 *
 * @example
 * // Response khi lỗi 404
 * {
 *   statusCode: 404,
 *   timestamp: "2025-12-14T16:30:00.000Z",
 *   path: "/api/products/invalid-id",
 *   message: "Product not found"
 * }
 */
export interface ApiErrorResponse {
  /** HTTP Status Code (400, 401, 404, 500, etc.) */
  statusCode: number;
  /** Thời điểm xảy ra lỗi (ISO string) */
  timestamp: string;
  /** Đường dẫn API gây lỗi */
  path: string;
  /** Thông báo lỗi hoặc object chứa chi tiết lỗi */
  message: string | Record<string, unknown>;
}

/**
 * Metadata cho các API có phân trang.
 * Được dùng khi load danh sách (products, users, orders, etc.)
 */
export interface PaginationMeta {
  /** Tổng số items trong database */
  total: number;
  /** Trang hiện tại (1-indexed) */
  page: number;
  /** Tổng số trang */
  lastPage: number;
  /** Số items mỗi trang */
  limit: number;
}

// ==================== SERVER ACTION RESULT ====================

/**
 * Kết quả trả về từ Server Actions.
 * Đơn giản hóa error handling ở client.
 *
 * @template T - Kiểu dữ liệu trả về (nếu có)
 *
 * @example
 * // Trong Server Action
 * async function createProductAction(data): Promise<ActionResult> {
 *   try {
 *     await http("/products", { method: "POST", body: data });
 *     return { success: true };
 *   } catch (error) {
 *     return { error: error.message };
 *   }
 * }
 *
 * // Ở Client Component
 * const result = await createProductAction(formData);
 * if (result.error) {
 *   showToast(result.error);
 * }
 */
export interface ActionResult<T = void> {
  /** true nếu thành công */
  success?: boolean;
  /** Dữ liệu trả về (optional) */
  data?: T;
  /** Error message nếu thất bại */
  error?: string;
}

// ==================== USER DTOs ====================

/**
 * DTO để tạo user mới trong Admin Panel.
 */
export interface CreateUserDto {
  /** Email (phải unique) */
  email: string;
  /** Tên */
  firstName: string;
  /** Họ */
  lastName: string;
  /** Mật khẩu (sẽ được hash ở backend) */
  password: string;
}

/**
 * DTO để cập nhật thông tin user.
 * Chỉ cần truyền các fields muốn thay đổi.
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ==================== PRODUCT DTOs ====================

/**
 * DTO để tạo sản phẩm mới.
 *
 * 📝 LƯU Ý: Sau khi tạo, hệ thống tự động sinh SKUs từ options.
 *
 * @example
 * {
 *   name: "iPhone 15 Pro Max",
 *   categoryId: "xxx",
 *   brandId: "yyy",
 *   options: [
 *     { name: "Màu sắc", values: ["Đen", "Trắng"] },
 *     { name: "Dung lượng", values: ["256GB", "512GB"] }
 *   ]
 * }
 * // → Tự động tạo 4 SKUs (2 màu x 2 dung lượng)
 */
export interface CreateProductDto {
  /** Tên sản phẩm (VD: "iPhone 15 Pro Max") */
  name: string;
  /** Mô tả sản phẩm (optional) */
  description?: string;
  /** ID danh mục (bắt buộc) */
  categoryId: string;
  /** ID thương hiệu (bắt buộc) */
  brandId: string;
  /** Danh sách options và values */
  options?: { name: string; values: string[] }[];
}

/**
 * DTO để cập nhật sản phẩm.
 * ⚠️ Nếu thay đổi options, SKUs sẽ được sync lại (xem SkuManagerService).
 */
export interface UpdateProductDto {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  options?: { name: string; values: string[] }[];
}

// ==================== CATEGORY DTOs ====================

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  parentId?: string;
  imageUrl?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  parentId?: string;
  imageUrl?: string;
}

// ==================== BRAND DTOs ====================

export interface CreateBrandDto {
  name: string;
  imageUrl?: string;
}

export interface UpdateBrandDto {
  name?: string;
  imageUrl?: string;
}

// ==================== SKU DTOs ====================

/**
 * DTO để cập nhật SKU (biến thể sản phẩm).
 * Admin dùng để set giá và tồn kho cho từng biến thể.
 */
export interface UpdateSkuDto {
  /** Giá bán (VND) */
  price?: number;
  /** Số lượng tồn kho */
  stock?: number;
  /** URL ảnh sản phẩm */
  imageUrl?: string;
  /** Trạng thái: ACTIVE (còn bán) hoặc INACTIVE (ngừng bán) */
  status?: "ACTIVE" | "INACTIVE";
}

// ==================== AUTH RESPONSE ====================

/**
 * Response từ API login/register.
 * Chứa tokens và thông tin user cơ bản.
 */
export interface LoginResponse {
  /** JWT Access Token (dùng để gọi API) */
  accessToken: string;
  /** Refresh Token (dùng để lấy Access Token mới) */
  refreshToken: string;
  /** Thông tin user cơ bản */
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
}

// ==================== COUPON DTOs ====================

export interface CreateCouponDto {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
}

export interface UpdateCouponDto {
  code?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  isActive?: boolean;
}

// ==================== ANALYTICS DTOs ====================

export interface AnalyticsStats {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  sold: number;
  revenue: number;
}
