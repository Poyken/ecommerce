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
 * - `_count`: Field đặc biệt từ Prisma aggregations (đếm số lượng relation). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Single Source of Truth: Là "xương sống" của ứng dụng, đảm bảo dữ liệu hiển thị trên UI hoàn toàn khớp với dữ liệu từ Database.
 * - Debugging: Giúp phát hiện ngay lập tức nếu API đổi cấu hình (vd: đổi field `price` thành `unitPrice`), tiết kiệm hàng giờ debug mò mẫm.

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
  | "RETURNED" // Đã trả hàng
  | "COMPLETED"; // Hoàn thành

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
  /** URL avatar của user */
  avatarUrl?: string | null;
  /** OAuth provider (google, facebook, etc.) */
  provider?: string | null;
  /** ID từ OAuth provider */
  socialId?: string | null;
  /** Đã bật xác thực 2 bước */
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: { role: Role }[];
  addresses?: Address[];
  /** User's permissions */
  permissions?: { permission: Permission }[];
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
 * Role with its assigned permissions.
 */
export interface RoleWithPermissions extends Role {
  permissions: {
    permission: Permission;
  }[];
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
  /** SEO: Meta description */
  metaDescription?: string | null;
  /** SEO: Meta keywords */
  metaKeywords?: string | null;
  /** SEO: Meta title */
  metaTitle?: string | null;

  // Prisma aggregation fields
  _count?: {
    products: number;
  };

  // Relations
  parent?: Category | null;
  children?: Category[];

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
  /** Stock đang được reserve (chưa thanh toán) */
  reservedStock?: number;

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
  /** Cached min price from SKUs */
  minPrice?: number | string | null;
  /** Cached max price from SKUs */
  maxPrice?: number | string | null;
  /** Cached average rating (computed from reviews) */
  avgRating?: number | null;
  /** Cached review count */
  reviewCount?: number;
  /** SEO: Meta description */
  metaDescription?: string | null;
  /** SEO: Meta keywords */
  metaKeywords?: string | null;
  /** SEO: Meta title */
  metaTitle?: string | null;
  /** Soft delete timestamp */
  deletedAt?: string | null;

  // Relations (Partial - có thể không được include)
  category?: Category;
  brand?: Brand;
  options?: ProductOption[];
  skus?: Sku[];
  reviews?: Review[];
  /** Product images */
  translations?: ProductTranslation[];

  createdAt: string;
  updatedAt: string;

  // Prisma aggregation
  _count?: {
    reviews: number;
  };

  // Frontend enriched
  images?: ProductImage[] | { url: string; alt?: string | null }[] | string[];
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
  updatedAt?: string;
  /** Hình ảnh đính kèm review */
  images?: string[];
  /** Phản hồi từ shop */
  reply?: string | null;
  /** Thời điểm phản hồi */
  replyAt?: string | null;

  // Relations
  user?: User;
  /** SKU cụ thể được đánh giá (nếu có) */
  skuId?: string | null;
  sku?: Sku | null;
  product?: Product;

  // AI fields
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | null;
  autoTags?: string[];
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
  createdAt?: string;
  updatedAt?: string;
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
  /** Ngày đặt hàng */
  createdAt: string;
  updatedAt?: string;
  /** Mã vận đơn (shipping tracking) */
  shippingCode?: string | null;
  /** Địa chỉ ID (reference) */
  addressId?: string | null;

  // Relations
  items?: OrderItem[];
  user?: User;
  couponId?: string | null;
  coupon?: Coupon | null;
  address?: Address | null;
  cancellationReason?: string | null;
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
  createdAt?: string;
  updatedAt?: string;
  sku?: Sku;
}

/**
 * Giỏ hàng của user.
 */
export interface Cart {
  id: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
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
  /** Soft delete timestamp */
  deletedAt?: string | null;
  /** Author user ID */
  userId?: string | null;
  /** Author user relation */
  user?: User | null;
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
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  /** User ID của người nhận */
  userId?: string;
}

// =============================================================================
// 🖼️ IMAGES - Hình ảnh sản phẩm
// =============================================================================

/**
 * Hình ảnh của sản phẩm.
 */
export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  displayOrder: number;
  productId: string;
}

/**
 * Hình ảnh của SKU (biến thể).
 */
export interface SkuImage {
  id: string;
  url: string;
  alt?: string | null;
  displayOrder: number;
  skuId: string;
}

// =============================================================================
// 🌐 TRANSLATIONS - Đa ngôn ngữ
// =============================================================================

/**
 * Bản dịch sản phẩm cho các ngôn ngữ khác nhau.
 */
export interface ProductTranslation {
  id: string;
  productId: string;
  /** Mã ngôn ngữ (vd: "vi", "en") */
  locale: string;
  name: string;
  description?: string | null;
}

// =============================================================================
// 📦 INVENTORY - Quản lý kho
// =============================================================================

/**
 * Log thay đổi tồn kho.
 */
export interface InventoryLog {
  id: string;
  skuId: string;
  /** Số lượng thay đổi (+/-) */
  changeAmount: number;
  /** Tồn kho trước thay đổi */
  previousStock: number;
  /** Tồn kho sau thay đổi */
  newStock: number;
  /** Lý do thay đổi (vd: "ORDER", "MANUAL_ADJUST") */
  reason: string;
  userId?: string | null;
  createdAt: string;
  // Relations
  sku?: Sku;
  user?: User | null;
}

// =============================================================================
// 📋 AUDIT LOG - Lịch sử hoạt động
// =============================================================================

/**
 * Log hoạt động hệ thống (security audit).
 */
export interface AuditLog {
  id: string;
  userId?: string | null;
  /** Hành động (vd: "CREATE", "UPDATE", "DELETE") */
  action: string;
  /** Resource bị ảnh hưởng (vd: "Product", "Order") */
  resource: string;
  /** Dữ liệu chi tiết (JSON) */
  payload?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  // Relations
  user?: User | null;
}

// =============================================================================
// 🚩 FEATURE FLAGS - Quản lý tính năng
// =============================================================================

/**
 * Feature flag để bật/tắt tính năng theo điều kiện.
 */
export interface FeatureFlag {
  id: string;
  /** Key unique (vd: "new_checkout_flow") */
  key: string;
  description?: string | null;
  isEnabled: boolean;
  /** Quy tắc kích hoạt (JSON) */
  rules?: unknown;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 📧 NEWSLETTER - Đăng ký nhận tin
// =============================================================================

/**
 * Người đăng ký nhận newsletter.
 */
export interface NewsletterSubscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
// =============================================================================
// 💬 CHAT - Tin nhắn hỗ trợ
// =============================================================================

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "USER" | "ADMIN";
  content: string;
  type: "TEXT" | "IMAGE" | "PRODUCT" | "ORDER";
  metadata?: Record<string, unknown>;
  isRead: boolean;
  sentAt: string;
  clientTempId?: string;
  status?: "sending" | "sent" | "error";
  conversation?: ChatConversation;
}

export interface ChatConversation {
  id: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  messages?: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

// =============================================================================
// 🏢 TENANTS - Quản lý cửa hàng (SaaS)
// =============================================================================

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  domain: string;
  themeConfig?: Record<string, any>;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    products: number;
    orders: number;
  };
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  billingFrequency: "MONTHLY" | "YEARLY";
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId?: string | null;
  amount: number | string;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID";
  description?: string | null;
  paidAt?: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}
// =============================================================================
// 🔄 RMA - Return Merchandise Authorization
// =============================================================================

export type ReturnType = "REFUND_ONLY" | "RETURN_AND_REFUND" | "EXCHANGE";

export type ReturnMethod = "AT_COUNTER" | "PICKUP" | "SELF_SHIP";

export type RefundMethod = "ORIGINAL_PAYMENT" | "BANK_TRANSFER" | "WALLET";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "WAITING_FOR_RETURN"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "INSPECTING"
  | "REFUNDED"
  | "REJECTED"
  | "CANCELLED";

/**
 * Yêu cầu trả hàng/hoàn tiền.
 */
export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  status: ReturnStatus;
  type: ReturnType;
  reason: string;
  description?: string | null;
  images?: string[];

  // Return shipping details
  returnMethod?: ReturnMethod | null;
  trackingCode?: string | null;
  carrier?: string | null;
  pickupAddress?: any; // Json

  // Refund details
  refundMethod: RefundMethod;
  bankAccount?: any; // Json

  // Admin fields
  inspectionNotes?: string | null;
  rejectedReason?: string | null;

  createdAt: string;
  updatedAt: string;
  tenantId: string;

  // Relations
  order?: Order;
  user?: User;
  items?: ReturnItem[];
}

/**
 * Item cụ thể trong yêu cầu trả hàng.
 */
export interface ReturnItem {
  id: string;
  returnRequestId: string;
  orderItemId: string;
  quantity: number;

  // Relations
  returnRequest?: ReturnRequest;
  orderItem?: OrderItem;
}
