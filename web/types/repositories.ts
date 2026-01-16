import { Brand, Category, Product, Sku } from "./models";
import { ApiResponse, PaginatedData } from "./dtos";

/**
 * =====================================================================
 * REPOSITORY INTERFACES - Blueprints for data access
 * =====================================================================
 *
 * CLEAN ARCHITECTURE:
 * Repositories define WHAT data the application needs, without
 * specifying HOW it's fetched (fetch, axios, grpc, etc).
 */

export interface GetProductsParams {
  limit?: number;
  page?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  ids?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  includeSkus?: boolean;
}

export interface IProductRepository {
  getProducts(params?: GetProductsParams): Promise<ApiResponse<Product[]>>;
  getProduct(id: string): Promise<Product | null>;
  getCategories(): Promise<Category[]>;
  getBrands(): Promise<Brand[]>;
  getSku(id: string): Promise<Sku | null>;
  getRelatedProducts(productId: string, limit?: number): Promise<Product[]>;
}

export interface ICartRepository {
  getCart(): Promise<any>;
  addItem(skuId: string, quantity: number): Promise<any>;
  removeItem(itemId: string): Promise<any>;
  updateQuantity(itemId: string, quantity: number): Promise<any>;
}
