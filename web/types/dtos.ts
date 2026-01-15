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
 * - `XxxResponse`: Cấu trúc dữ liệu trả về từ API (thường bọc trong `ApiResponse`). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Contract giữa FE & BE: Đảm bảo hai bên hiểu nhau chính xác về dữ liệu gửi/nhận, giảm thiểu bug do sai tên trường hay sai kiểu dữ liệu.
 * - Auto-Completion & Intellisense: Giúp Developer code nhanh hơn trên VSCode nhờ gợi ý code thông minh.
 * - Form Handling: Dùng làm Schema cho React Hook Form để validate form đăng ký, login, checkout...

 * =====================================================================
 */

export * from "./api"; // Re-export base API types

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
  slug?: string;
  /** Mô tả sản phẩm (optional) */
  description?: string;
  /** Danh sách ID danh mục (nhiều danh mục) */
  categoryIds: string[];
  /** ID thương hiệu (bắt buộc) */
  brandId: string;
  /** Danh sách options và values */
  options?: { name: string; values: string[] }[];

  // SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

/**
 * DTO để cập nhật sản phẩm.
 * ⚠️ Nếu thay đổi options, SKUs sẽ được sync lại (xem SkuManagerService).
 */
export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  categoryIds?: string[];
  brandId?: string;
  options?: { name: string; values: string[] }[];

  // SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
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
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  growth: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
  lifetimeProducts: number;
  lifetimeCustomers: number;
}

export interface SalesDataPoint {
  date: string;
  amount: number;
}

export interface TopProduct {
  skuId: string;
  productName: string;
  quantity: number;
  revenue: number;
  variants?: string;
  skuCode?: string;
}

// ==================== TENANT DTOs ====================

export interface CreateTenantDto {
  name: string;
  domain: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  themeConfig?: Record<string, any>;
  adminEmail?: string;
  adminPassword?: string;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  plan?: "BASIC" | "PRO" | "ENTERPRISE";
  themeConfig?: Record<string, any>;
}
// ==================== SECURITY DTOs ====================

export interface SecurityStats {
  authAttempts: number;
  mfaPercentage: number;
  blockedIps: number;
  ddosStatus: string;
  threatGrade: string;
}

// ==================== ORDER DTOs (Synced from API) ====================

/**
 * DTO để tạo đơn hàng mới.
 * @apiSource api/src/orders/dto/create-order.dto.ts
 */
export interface CreateOrderDto {
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingPhone?: string;
  itemIds?: string[];
  couponCode?: string;
  returnUrl?: string;
  addressId?: string;
}

// ==================== CART DTOs (Synced from API) ====================

/**
 * @apiSource api/src/cart/dto/add-to-cart.dto.ts
 */
export interface AddToCartDto {
  skuId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

// ==================== REVIEW DTOs (Synced from API) ====================

/**
 * @apiSource api/src/reviews/dto/create-review.dto.ts
 */
export interface CreateReviewDto {
  productId: string;
  skuId?: string;
  rating: number;
  content?: string;
  images?: string[];
}

// ==================== ADDRESS DTOs (Synced from API) ====================

/**
 * @apiSource api/src/addresses/dto/create-address.dto.ts
 */
export interface CreateAddressDto {
  recipientName: string;
  phoneNumber: string;
  street: string;
  city: string;
  district: string;
  ward?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
}

export interface UpdateAddressDto {
  recipientName?: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  district?: string;
  ward?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
}

// ==================== FILTER DTOs (Synced from API) ====================

/**
 * @apiSource api/src/catalog/products/dto/filter-product.dto.ts
 */
export type ProductSortOption =
  | "price_asc"
  | "price_desc"
  | "newest"
  | "oldest"
  | "rating_desc";

export interface FilterProductDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  ids?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
  includeSkus?: boolean;
}

// ==================== LOGIN DTOs (Synced from API) ====================

/**
 * @apiSource api/src/auth/dto/login.dto.ts
 */
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
