/**
 * =====================================================================
 * SHARED TYPES - API Types Exported for Frontend Consumption
 * =====================================================================
 *
 * These are pure TypeScript interfaces without class-validator decorators.
 * They represent the "contract" between API and Web.
 *
 * SYNC: web/types/dtos.ts should mirror these interfaces.
 * =====================================================================
 */

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
}

// ============================================================================
// AUTH
// ============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles?: { role: { name: string } }[];
  };
}

// ============================================================================
// PRODUCTS
// ============================================================================

export type ProductSortOption =
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'oldest'
  | 'rating_desc';

export interface FilterProductInput extends PaginationQuery {
  search?: string;
  categoryId?: string;
  brandId?: string;
  ids?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
  includeSkus?: boolean;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  categoryIds: string[];
  brandId: string;
  options?: { name: string; values: string[] }[];
  images?: { url: string; alt?: string; displayOrder?: number }[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  categoryIds?: string[];
  brandId?: string;
  options?: { name: string; values: string[] }[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// ============================================================================
// ORDERS
// ============================================================================

export interface CreateOrderInput {
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

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  note?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'COMPLETED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

// ============================================================================
// CATEGORIES & BRANDS
// ============================================================================

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parentId?: string;
  imageUrl?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string;
  imageUrl?: string;
}

export interface CreateBrandInput {
  name: string;
  imageUrl?: string;
}

export interface UpdateBrandInput {
  name?: string;
  imageUrl?: string;
}

// ============================================================================
// SKU
// ============================================================================

export interface UpdateSkuInput {
  price?: number;
  salePrice?: number;
  stock?: number;
  imageUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ============================================================================
// CART
// ============================================================================

export interface AddToCartInput {
  skuId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

// ============================================================================
// REVIEWS
// ============================================================================

export interface CreateReviewInput {
  productId: string;
  skuId?: string;
  rating: number;
  content?: string;
  images?: string[];
}

// ============================================================================
// ADDRESSES
// ============================================================================

export interface CreateAddressInput {
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

export interface UpdateAddressInput extends Partial<CreateAddressInput> {}
