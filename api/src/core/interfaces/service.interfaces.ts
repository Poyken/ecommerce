/**
 * =====================================================================
 * SERVICE INTERFACES - DEPENDENCY INVERSION PRINCIPLE
 * =====================================================================
 *
 * =====================================================================
 */

import { PaginatedResult } from '@core/repository/base.repository';

// =====================================================================
// PRODUCT INTERFACES
// =====================================================================

export interface IProductService {
  findAll(query: ProductListQuery): Promise<PaginatedResult<ProductListItem>>;
  findOne(id: string): Promise<ProductDetail | null>;
  findBySlug(slug: string): Promise<ProductDetail | null>;
  search(query: string, limit?: number): Promise<ProductListItem[]>;
  getRelatedProducts(
    productId: string,
    limit?: number,
  ): Promise<ProductListItem[]>;
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  minPrice: number;
  maxPrice: number;
  imageUrl: string | null;
  avgRating: number;
  reviewCount: number;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  brand: { id: string; name: string } | null;
  categories: { id: string; name: string; slug: string }[];
  images: { url: string; alt: string | null }[];
  options: ProductOption[];
  skus: ProductSku[];
}

export interface ProductOption {
  id: string;
  name: string;
  values: { id: string; value: string; imageUrl?: string }[];
}

export interface ProductSku {
  id: string;
  skuCode: string;
  price: number;
  salePrice: number | null;
  stock: number;
  imageUrl: string | null;
  optionValues: { optionId: string; value: string }[];
}

// =====================================================================
// ORDER INTERFACES
// =====================================================================

export interface IOrderService {
  create(userId: string, dto: CreateOrderDto): Promise<OrderResult>;
  findByUser(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<OrderSummary>>;
  findById(id: string, userId?: string): Promise<OrderDetail | null>;
  updateStatus(id: string, status: string): Promise<OrderResult>;
  cancel(id: string, userId: string, reason: string): Promise<OrderResult>;
}

export interface CreateOrderDto {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: string;
  notes?: string;
  couponCode?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: Date;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  payments: Payment[];
  statusHistory: StatusChange[];
}

export interface OrderItem {
  id: string;
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Payment {
  id: string;
  method: string;
  status: string;
  amount: number;
  paidAt?: Date;
}

export interface StatusChange {
  status: string;
  note?: string;
  changedAt: Date;
  changedBy?: string;
}

export interface OrderResult {
  success: boolean;
  data?: OrderDetail;
  error?: string;
}

// =====================================================================
// CART INTERFACES
// =====================================================================

export interface ICartService {
  getCart(userId: string): Promise<CartDetail>;
  addItem(userId: string, skuId: string, quantity: number): Promise<CartDetail>;
  updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartDetail>;
  removeItem(userId: string, itemId: string): Promise<CartDetail>;
  clear(userId: string): Promise<void>;
  calculateTotals(userId: string): Promise<CartTotals>;
}

export interface CartDetail {
  id: string;
  items: CartItem[];
  totals: CartTotals;
}

export interface CartItem {
  id: string;
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
  optionValues: { name: string; value: string }[];
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

// =====================================================================
// COMMON INTERFACES
// =====================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Symbol keys for dependency injection
export const SERVICE_TOKENS = {
  PRODUCT_SERVICE: Symbol('IProductService'),
  ORDER_SERVICE: Symbol('IOrderService'),
  CART_SERVICE: Symbol('ICartService'),
} as const;
