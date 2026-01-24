import { http } from "@/lib/http";
import { normalizePaginationParams, PaginationParams } from "@/lib/utils";
import {
  ApiResponse,
  CreateBrandDto,
  CreateCategoryDto,
  CreateCouponDto,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateCouponDto,
} from "@/types/dtos";
import { Brand, Category, Coupon } from "@/types/models";

/**
 * =====================================================================
 * ADMIN METADATA SERVICE - Domain logic for metadata management (Brands, Categories, Coupons)
 * =====================================================================
 */

export const adminMetadataService = {
  // --- BRANDS ---

  getBrands: async (
    paramsOrPage?: number | PaginationParams,
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Brand[]>>("/brands", { params });
  },

  createBrand: async (data: CreateBrandDto | FormData) => {
    if (data instanceof FormData) {
      return http.post<ApiResponse<Brand>>("/brands", data);
    }
    return http.post<ApiResponse<Brand>>("/brands", data);
  },

  updateBrand: async (id: string, data: UpdateBrandDto | FormData) => {
    if (data instanceof FormData) {
      return http.patch<ApiResponse<Brand>>(`/brands/${id}`, data);
    }
    return http.patch<ApiResponse<Brand>>(`/brands/${id}`, data);
  },

  deleteBrand: async (id: string) => {
    return http.delete(`/brands/${id}`);
  },

  // --- CATEGORIES ---

  getCategories: async (
    paramsOrPage?: number | PaginationParams,
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Category[]>>("/categories", { params });
  },

  createCategory: async (data: CreateCategoryDto | FormData) => {
    if (data instanceof FormData) {
      return http.post<ApiResponse<Category>>("/categories", data);
    }
    return http.post<ApiResponse<Category>>("/categories", data);
  },

  updateCategory: async (id: string, data: UpdateCategoryDto | FormData) => {
    if (data instanceof FormData) {
      return http.patch<ApiResponse<Category>>(`/categories/${id}`, data);
    }
    return http.patch<ApiResponse<Category>>(`/categories/${id}`, data);
  },

  deleteCategory: async (id: string) => {
    return http.delete(`/categories/${id}`);
  },

  // --- COUPONS ---

  getCoupons: async (
    paramsOrPage?: number | PaginationParams,
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Coupon[]>>("/coupons", { params });
  },

  createCoupon: async (data: CreateCouponDto) => {
    return http.post<ApiResponse<Coupon>>("/coupons", data);
  },

  updateCoupon: async (id: string, data: UpdateCouponDto) => {
    return http.patch<ApiResponse<Coupon>>(`/coupons/${id}`, data);
  },

  deleteCoupon: async (id: string) => {
    return http.delete(`/coupons/${id}`);
  },

  // --- IMPORT & EXPORT ---

  exportCategories: async () => {
    return http.get<ArrayBuffer>("/categories/export/excel", {
      responseType: "arraybuffer",
    });
  },

  importCategories: async (formData: FormData) => {
    return http.post<ApiResponse<{ imported: number }>>(
      "/categories/import/excel",
      formData
    );
  },

  previewCategoriesImport: async (formData: FormData) => {
    return http.post<ApiResponse<Category[]>>(
      "/categories/import/preview",
      formData
    );
  },

  downloadCategoryTemplate: async () => {
    return http.get<ArrayBuffer>("/categories/import/template", {
      responseType: "arraybuffer",
    });
  },

  exportBrands: async () => {
    return http.get<ArrayBuffer>("/brands/export/excel", {
      responseType: "arraybuffer",
    });
  },

  importBrands: async (formData: FormData) => {
    return http.post<ApiResponse<{ imported: number }>>(
      "/brands/import/excel",
      formData
    );
  },

  previewBrandsImport: async (formData: FormData) => {
    return http.post<ApiResponse<Brand[]>>("/brands/import/preview", formData);
  },

  downloadBrandTemplate: async () => {
    return http.get<ArrayBuffer>("/brands/import/template", {
      responseType: "arraybuffer",
    });
  },
};
