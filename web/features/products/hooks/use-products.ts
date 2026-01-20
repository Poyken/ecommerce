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
 * - Key được tạo từ params để cache riêng biệt cho từng filter *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Hook React tùy chỉnh để tách biệt logic khỏi UI, giúp component dễ đọc và dễ test hơn.

 * =====================================================================
 */

"use client";

import { Product, Category, Brand } from "@/types/models";
import useSWR from "swr";
import {
  getProductsAction,
  getProductAction,
  getCategoriesAction,
  getBrandsAction,
} from "../actions";

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
 * Hook để fetch danh sách sản phẩm với hybrid server/client pattern.
 *
 * @param params - Tham số filter và phân trang
 * @param initialData - Initial data từ server action (optional)
 * @returns { products, meta, error, isLoading, isValidating, mutate }
 *
 * @example
 * // In Server Component/Page:
 * const initialData = await getProductsAction({ categoryId: "abc", page: 1 });
 *
 * // In Client Component:
 * const { products, isLoading } = useProducts(
 *   { categoryId: "abc", page: 1 },
 *   initialData.success ? initialData.data : undefined
 * );
 */
export function useProducts(
  params?: GetProductsParams,
  initialData?: { products: Product[]; meta: any },
) {
  // Create stable SWR key from params
  // Using array key allows SWR to handle object serialization properly (if deep compare enabled)
  // or we can just spread values. For simplicity/stability with SWR default shallow,
  // we can use the params object directly IF we trust SWR's serialization or custom compare.
  // But safest is to flatten or keep object if SWR config handles it.
  // Default SWR matches by reference for objects unless customized.
  // We'll use specific parts of params to ensure uniqueness.
  const cacheKey = params ? ["products", params] : ["products", "default"];

  // Use SWR with server action, fallback to initial data
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    cacheKey,
    async ([_, p]) => {
      // p is inferred as the params type from the key
      const result = await getProductsAction(p as GetProductsParams);
      if (result.success && result.data) {
        return {
          products: result.data || [],
          meta: result.meta || {
            total: 0,
            page: 1,
            limit: 10,
            lastPage: 0,
          },
        };
      }
      return {
        products: [],
        meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
      };
    },
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true, // Keep showing previous data while loading new filter
    },
  );

  const result = data ||
    initialData || {
      products: [],
      meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
    };

  return {
    products: result.products,
    meta: result.meta,
    error,
    isLoading: isLoading && !initialData,
    isValidating,
    mutate,
  };
}

// =============================================================================
// 🛒 USE PRODUCT DETAIL HOOK
// =============================================================================

/**
 * Hook để fetch chi tiết sản phẩm với hybrid server/client pattern.
 *
 * @param id - ID sản phẩm
 * @param initialData - Initial product data từ server action (optional)
 * @returns { product, error, isLoading }
 */
export function useProduct(id: string | null, initialData?: Product) {
  const cacheKey = id ? `product-${id}` : null;

  const { data, error, isLoading } = useSWR(
    cacheKey,
    async () => {
      if (!id) return null;
      const result = await getProductAction(id);
      return result.success ? result.data : null;
    },
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
    },
  );

  return {
    product: data || initialData || null,
    error,
    isLoading: isLoading && !initialData,
  };
}

// =============================================================================
// 🏷️ USE CATEGORIES HOOK
// =============================================================================

/**
 * Hook để fetch danh sách categories với hybrid server/client pattern.
 *
 * @param initialData - Initial categories data từ server action (optional)
 */
export function useCategories(initialData?: Category[]) {
  const { data, error, isLoading } = useSWR(
    "categories",
    async () => {
      const result = await getCategoriesAction();
      return result.success ? result.data : [];
    },
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
    },
  );

  return {
    categories: data || initialData || [],
    error,
    isLoading: isLoading && !initialData,
  };
}

// =============================================================================
// 🏢 USE BRANDS HOOK
// =============================================================================

/**
 * Hook để fetch danh sách brands với hybrid server/client pattern.
 *
 * @param initialData - Initial brands data từ server action (optional)
 */
export function useBrands(initialData?: Brand[]) {
  const { data, error, isLoading } = useSWR(
    "brands",
    async () => {
      const result = await getBrandsAction();
      return result.success ? result.data : [];
    },
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
    },
  );

  return {
    brands: data || initialData || [],
    error,
    isLoading: isLoading && !initialData,
  };
}
