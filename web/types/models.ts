/**
 * =====================================================================
 * MODEL DEFINITIONS - Định nghĩa các kiểu dữ liệu chính
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này định nghĩa các TypeScript interfaces cho entities trong hệ thống.
 * Các interfaces này tương ứng với các bảng trong database (Prisma models).
 *
 * TẠI SAO CẦN FRONTEND MODELS?
 * 1. Type Safety: TypeScript kiểm tra kiểu dữ liệu tại compile time.
 *    - Giúp tránh lỗi truy cập field không tồn tại (vd: `user.name` thay vì `user.fullName`).
 * 2. IntelliSense: IDE (VS Code) gợi ý code cực mạnh khi gõ dấu chấm.
 * 3. Documentation: Nhìn vào interface là hiểu ngay cấu trúc dữ liệu.
 *
 * QUY ƯỚC:
 * - Fields optional (có `?`): Không bắt buộc hoặc có thể `null` trong DB.
 * - Nested objects (như `category` trong `Product`): Là relations (kết bảng).
 * - `_count`: Field đặc biệt từ Prisma aggregations (đếm số lượng relation).
 * =====================================================================
 */

// =============================================================================
// 📊 ENUMS - Các giá trị cố định
// =============================================================================

/**
 * Trạng thái đơn hàng.
 *
 * FLOW: PENDING → PROCESSING → SHIPPED → DELIVERED
 * Hoặc: PENDING → CANCELLED (nếu hủy đơn)
 */
export type OrderStatus =
  | "PENDING" // Chờ xử lý (mới tạo)
  | "PROCESSING" // Đang xử lý (shop đang chuẩn bị)
  | "SHIPPED" // Đã giao cho shipper
  | "DELIVERED" // Đã giao thành công
  | "CANCELLED" // Đã hủy
  | "RETURNED"; // Đã hoàn trả

/**
 * Trạng thái thanh toán.
 */
export type PaymentStatus =
  | "UNPAID" // Chưa thanh toán (COD)
  | "PENDING" // Đang chờ xử lý (online payment)
  | "PAID" // Đã thanh toán
  | "FAILED" // Thanh toán thất bại
  | "REFUNDED"; // Đã hoàn tiền

// =============================================================================
// 👤 USER & AUTHENTICATION - Người dùng và xác thực
// =============================================================================

/**
 * Thông tin người dùng.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  roles?: { role: Role }[];
  addresses?: Address[];
}

/**
 * Vai trò (Role) trong hệ thống RBAC.
 * VD: Admin, Moderator, Customer
 */
export interface Role {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quyền hạn cụ thể.
 * VD: read:products, write:orders, admin:users
 */
export interface Permission {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 📦 PRODUCT CATALOG - Danh mục sản phẩm
// =============================================================================

/**
 * Danh mục sản phẩm.
 * VD: Điện thoại, Laptop, Phụ kiện
 */
export interface Category {
  id: string;
  name: string;
  /** Slug URL-friendly (vd: "dien-thoai") */
  slug: string;
  /** ID danh mục cha (nếu là sub-category) */
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;

  // Prisma aggregation fields
  _count?: {
    products: number;
  };

  // Frontend/API enriched fields
  imageUrl?: string | null;
  productCount?: number;
}

/**
 * Thương hiệu.
 * VD: Apple, Samsung, Xiaomi
 */
export interface Brand {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;

  // Prisma aggregation
  _count?: {
    products: number;
  };
}

/**
 * Option của sản phẩm (cấu hình biến thể).
 * VD: Màu sắc, Dung lượng, Size
 *
 * Một Product có nhiều ProductOptions.
 * Mỗi ProductOption có nhiều OptionValues.
 */
export interface ProductOption {
  id: string;
  /** Tên option (vd: "Màu sắc", "Dung lượng") */
  name: string;
  /** Thứ tự hiển thị */
  displayOrder?: number | null;
  productId: string;
  /** Các giá trị của option này */
  values: OptionValue[];
}

/**
 * Giá trị cụ thể của một option.
 * VD: "Đen", "Trắng" cho option "Màu sắc"
 */
export interface OptionValue {
  id: string;
  /** Giá trị (vd: "Đen", "128GB") */
  value: string;
  /** Ảnh minh họa cho giá trị này (nếu có) */
  imageUrl?: string | null;
  optionId: string;
}

/**
 * SKU (Stock Keeping Unit) - Biến thể sản phẩm cụ thể.
 *
 * VD: iPhone 15 Pro Max - Đen - 256GB là 1 SKU
 *     iPhone 15 Pro Max - Trắng - 512GB là SKU khác
 *
 * Mỗi SKU có giá và tồn kho riêng.
 */
export interface Sku {
  id: string;
  /** Mã SKU unique (vd: "IPHONE15PM-BLK-256") */
  skuCode: string;
  productId: string;
  /** Giá bán (Decimal từ Prisma → number hoặc string) */
  price?: number | string | null;
  /** Giá khuyến mãi (nếu có) */
  salePrice?: number | string | null;
  /** Số lượng tồn kho */
  stock: number;
  /** URL ảnh của biến thể này */
  imageUrl?: string | null;
  /** Trạng thái: ACTIVE hoặc INACTIVE */
  status: string;
  /** Metadata tùy chỉnh (JSON) */
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;

  // Relations
  /** Các OptionValue tạo nên SKU này (Join table structure) */
  optionValues?: {
    optionValue: OptionValue & {
      option: ProductOption;
    };
  }[];
  /** Product cha */
  product?: Product;

  // Frontend enriched
  /** Giá gốc (trước giảm giá) */
  originalPrice?: number | string | null;
}

/**
 * Sản phẩm.
 *
 * Product là entity chính, có thể có nhiều biến thể (SKUs).
 * Mỗi Product thuộc 1 Category và 1 Brand.
 */
export interface Product {
  id: string;
  name: string;
  /** Slug URL-friendly (vd: "iphone-15-pro-max") */
  slug: string;
  /** Mô tả sản phẩm (HTML hoặc plain text) */
  description?: string | null;
  categoryId: string;
  brandId: string;
  /** Metadata tùy chỉnh */
  metadata?: unknown;

  // Relations (Partial - có thể không được include)
  category?: Category;
  brand?: Brand;
  options?: ProductOption[];
  skus?: Sku[];
  reviews?: Review[];

  createdAt: string;
  updatedAt: string;

  // Prisma aggregation
  _count?: {
    reviews: number;
  };

  // Frontend enriched
  images?: { url: string; alt?: string }[] | string[];
}

// =============================================================================
// ⭐ REVIEWS - Đánh giá sản phẩm
// =============================================================================

/**
 * Đánh giá sản phẩm từ khách hàng.
 */
export interface Review {
  id: string;
  userId: string;
  productId: string;
  /** Điểm đánh giá (1-5 sao) */
  rating: number;
  /** Nội dung đánh giá */
  content?: string | null;
  /** Đã được duyệt chưa */
  isApproved: boolean;
  createdAt: string;

  // Relations
  user?: User;
  /** SKU cụ thể được đánh giá (nếu có) */
  skuId?: string | null;
  sku?: Sku | null;
}

// =============================================================================
// 📍 ADDRESS - Địa chỉ giao hàng
// =============================================================================

/**
 * Địa chỉ giao hàng của user.
 */
export interface Address {
  id: string;
  userId?: string;
  /** Là địa chỉ mặc định? */
  isDefault: boolean;
  /** Tên người nhận */
  recipientName: string;
  /** Số điện thoại */
  phoneNumber: string;
  /** Địa chỉ chi tiết (số nhà, phố) */
  street: string;
  /** Thành phố/Tỉnh */
  city: string;
  /** Quận/Huyện */
  district: string;
  /** Phường/Xã */
  ward?: string | null;
  /** Mã bưu điện */
  postalCode?: string | null;
  /** Quốc gia */
  country?: string | null;
  provinceId?: number | null;
  districtId?: number | null;
  wardCode?: string | null;
}

// =============================================================================
// 🛒 ORDERS - Đơn hàng
// =============================================================================

/**
 * Đơn hàng.
 */
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  /** Tổng tiền (đã bao gồm phí ship) */
  totalAmount: number | string;
  /** Phí vận chuyển */
  shippingFee: number | string;
  /** Tên người nhận */
  recipientName: string;
  /** SĐT người nhận */
  phoneNumber: string;
  /** Địa chỉ giao hàng đầy đủ */
  shippingAddress: string;
  /** Phương thức thanh toán (COD, MOMO, VNPAY, etc.) */
  paymentMethod?: string | null;
  paymentStatus: PaymentStatus;
  /** Mã giao dịch thanh toán */
  transactionId?: string | null;
  createdAt: string;

  // Relations
  items?: OrderItem[];
  user?: User;
  couponId?: string | null;
  coupon?: Coupon | null;
}

// =============================================================================
// 🎟️ COUPONS - Mã giảm giá
// =============================================================================

export interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number | string;
  minOrderAmount?: number | string | null;
  maxDiscountAmount?: number | string | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item trong đơn hàng.
 */
export interface OrderItem {
  id: string;
  orderId: string;
  skuId: string;
  quantity: number;
  /** Giá tại thời điểm mua (snapshot) */
  priceAtPurchase: number | string;
  sku?: Sku;
}

// =============================================================================
// 🛍️ CART - Giỏ hàng
// =============================================================================

/**
 * Item trong giỏ hàng.
 */
export interface CartItem {
  id: string;
  cartId: string;
  skuId: string;
  quantity: number;
  sku?: Sku;
}

/**
 * Giỏ hàng của user.
 */
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount?: number | string;
  totalItems?: number;
}

// =============================================================================
// 📝 BLOG - Content Management
// =============================================================================

/**
 * Blog post content.
 */
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string | null;
  category: string;
  author: string;
  language: string; // 'en' or 'vi'
  readTime?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Update Blog interface to include products
export interface BlogWithProducts extends Blog {
  products?: Product[];
}
// =============================================================================
// 🔔 NOTIFICATIONS - Thông báo hệ thống
// =============================================================================

/**
 * Thông báo hệ thống.
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
