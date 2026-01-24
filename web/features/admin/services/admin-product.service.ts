import { http } from "@/lib/http";
import { normalizePaginationParams, PaginationParams } from "@/lib/utils";
import {
  ApiResponse,
  CreateProductDto,
  UpdateProductDto,
  UpdateSkuDto,
} from "@/types/dtos";
import { Product, ProductTranslation, Sku } from "@/types/models";

/**
 * =====================================================================
 * ADMIN PRODUCT SERVICE - Domain logic for product management
 * =====================================================================
 */

export const adminProductService = {
  // --- PRODUCTS ---

  getProducts: async (
    paramsOrPage?: number | PaginationParams,
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Product[]>>("/products", { params });
  },

  createProduct: async (data: CreateProductDto) => {
    return http.post<ApiResponse<Product>>("/products", data);
  },

  updateProduct: async (id: string, data: UpdateProductDto) => {
    return http.patch<ApiResponse<Product>>(`/products/${id}`, data);
  },

  deleteProduct: async (id: string) => {
    return http.delete(`/products/${id}`);
  },

  // --- SKUS ---

  getSkus: async (
    paramsOrPage: number | PaginationParams = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    stockLimit?: number
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    if (status) params.status = status;
    if (stockLimit) params.stockLimit = stockLimit;

    return http.get<ApiResponse<Sku[]>>("/skus", { params });
  },

  updateSku: async (id: string, data: UpdateSkuDto | FormData) => {
    // If FormData, let browser set Content-Type
    if (data instanceof FormData) {
      return http.patch<ApiResponse<Sku>>(`/skus/${id}`, data);
    }
    return http.patch<ApiResponse<Sku>>(`/skus/${id}`, data);
  },

  // --- TRANSLATIONS (Product-specific) ---

  getProductTranslations: async (productId: string) => {
    return http.get<ApiResponse<ProductTranslation[]>>(
      `/products/${productId}/translations`
    );
  },

  updateProductTranslation: async (
    id: string,
    data: Partial<ProductTranslation>
  ) => {
    return http.post<ApiResponse<ProductTranslation>>(
      `/products/${id}/translations`,
      data
    );
  },

  // --- AI AUTOMATION ---

  generateProductContent: async (data: {
    productName: string;
    categoryName: string;
    brandName?: string;
  }) => {
    return http.post<ApiResponse<{ description: string; metaTitle: string; metaDescription: string }>>(
      "/ai-automation/generate-product-content",
      data
    );
  },

  translateText: async (data: { text: string; targetLocale: string }) => {
    return http.post<ApiResponse<{ text: string; locale: string }>>(
      "/ai-automation/translate",
      data
    );
  },

  // --- IMPORT & EXPORT ---

  exportProducts: async () => {
    return http.get<ArrayBuffer>("/products/export/excel", {
      responseType: "arraybuffer",
    });
  },

  importProducts: async (formData: FormData) => {
    return http.post<ApiResponse<{ imported: number }>>(
      "/products/import/excel",
      formData
    );
  },

  previewProductsImport: async (formData: FormData) => {
    return http.post<ApiResponse<Product[]>>(
      "/products/import/preview",
      formData
    );
  },

  downloadProductTemplate: async () => {
    return http.get<ArrayBuffer>("/products/import/template", {
      responseType: "arraybuffer",
    });
  },

  /**
   * Get low stock SKUs for dashboard
   */
  getLowStockSkus: async (limit = 5, stockLimit = 5) => {
    return http.get<{ data: Sku[]; meta: { total: number } }>(
      `/skus?limit=${limit}&stockLimit=${stockLimit}&includeProduct=true`
    );
  },
};
