/**
 * =====================================================================
 * USE PRODUCTS HOOK - Client-side caching với SWR
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SWR (Stale-While-Revalidate):
 * - Hiển thị data cũ (stale) ngay lập tức trong khi fetch data mới (revalidate)
 * - Cải thiện UX đáng kể vì user không phải chờ loading
 *
 * 2. DEDUPLICATION:
 * - Nếu nhiều component cùng gọi useProducts() với cùng params,
 *   SWR chỉ fetch 1 lần và share kết quả
 *
 * 3. CACHE KEY:
 * - Key được tạo từ params để cache riêng biệt cho từng filter
 * =====================================================================
 */

"use client";

import { ApiResponse } from "@/types/dtos";
import { Product } from "@/types/models";
import useSWR from "swr";

// =============================================================================
// 📦 TYPES
// =============================================================================

interface GetProductsParams {
  limit?: number;
  page?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  ids?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  includeSkus?: string;
}

// REMOVED local fetcher to use global SWR fetcher from SWRProvider
// which already uses the optimized http utility.

// =============================================================================
// 🛒 USE PRODUCTS HOOK
// =============================================================================

/**
 * Hook để fetch danh sách sản phẩm với client-side caching.
 *
 * @param params - Tham số filter và phân trang
 * @returns { data, error, isLoading, isValidating, mutate }
 *
 * @example
 * const { data, isLoading } = useProducts({ categoryId: "abc", page: 1 });
 */
export function useProducts(params?: GetProductsParams) {
  // Tạo URL với query params
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${apiUrl}/products?${searchParams.toString()}`;

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiResponse<Product[]>>(url);

  return {
    products: data?.data || [],
    meta: data?.meta || { total: 0, page: 1, limit: 10, lastPage: 0 },
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

// =============================================================================
// 🛒 USE PRODUCT DETAIL HOOK
// =============================================================================

/**
 * Hook để fetch chi tiết sản phẩm với client-side caching.
 *
 * @param id - ID sản phẩm
 * @returns { product, error, isLoading }
 */
export function useProduct(id: string | null) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = id ? `${apiUrl}/products/${id}` : null;

  const { data, error, isLoading } = useSWR<{ data: Product }>(url);

  return {
    product: data?.data || null,
    error,
    isLoading,
  };
}

// =============================================================================
// 🏷️ USE CATEGORIES HOOK
// =============================================================================

/**
 * Hook để fetch danh sách categories với client-side caching.
 */
export function useCategories() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${apiUrl}/categories`;

  const { data, error, isLoading } = useSWR<{
    data: import("@/types/models").Category[];
  }>(url);

  return {
    categories: data?.data || [],
    error,
    isLoading,
  };
}

// =============================================================================
// 🏢 USE BRANDS HOOK
// =============================================================================

/**
 * Hook để fetch danh sách brands với client-side caching.
 */
export function useBrands() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${apiUrl}/brands`;

  const { data, error, isLoading } = useSWR<{
    data: import("@/types/models").Brand[];
  }>(url);

  return {
    brands: data?.data || [],
    error,
    isLoading,
  };
}
