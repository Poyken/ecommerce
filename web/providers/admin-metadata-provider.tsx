"use client";

import { getBrandsAction, getCategoriesAction } from "@/actions/admin";
import { Brand, Category } from "@/types/models";
import React, { createContext, useContext } from "react";
import useSWR from "swr";

interface AdminMetadataContextType {
  brands: Brand[];
  categories: Category[];
  isLoadingBrands: boolean;
  isLoadingCategories: boolean;
  mutateBrands: () => void;
  mutateCategories: () => void;
}

const AdminMetadataContext = createContext<
  AdminMetadataContextType | undefined
>(undefined);

/**
 * =====================================================================
 * ADMIN METADATA PROVIDER - Cung cấp dữ liệu dùng chung trong Admin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID STRATEGY (SWR):
 * - Sử dụng thư viện `swr` để thực hiện chiến lược "Stale-While-Revalidate".
 * - Khi mở dialog hoặc chuyển trang, dữ liệu CŨ sẽ được hiển thị ngay lập tức (instant UI),
 *   trong khi hệ thống âm thầm gọi API để cập nhật dữ liệu mới nhất.
 *
 * 2. GLOBAL CACHING:
 * - Dữ liệu Brands và Categories được fetch một lần tại Layout và dùng cho TOÀN BỘ các dialog
 *   ở các trang khác nhau (Products, SKUs, v.v.).
 * - Loại bỏ việc prop-drilling (truyền props qua nhiều tầng) vốn gây khó bảo trì.
 *
 * 3. SERVER ACTION INTEGRATION:
 * - Kết hợp mượt mà với Server Actions (`getBrandsAction`, `getCategoriesAction`).
 * =====================================================================
 */

export function AdminMetadataProvider({
  children,
  initialBrands = [],
  initialCategories = [],
}: {
  children: React.ReactNode;
  initialBrands?: Brand[];
  initialCategories?: Category[];
}) {
  // Fetch Brands với SWR
  const {
    data: brandsRes,
    isLoading: isLoadingBrands,
    mutate: mutateBrands,
  } = useSWR("admin-brands", () => getBrandsAction(), {
    fallbackData: { data: initialBrands },
    revalidateOnFocus: false,
  });

  // Fetch Categories với SWR
  const {
    data: categoriesRes,
    isLoading: isLoadingCategories,
    mutate: mutateCategories,
  } = useSWR("admin-categories", () => getCategoriesAction(), {
    fallbackData: { data: initialCategories },
    revalidateOnFocus: false,
  });

  const brands = brandsRes && "data" in brandsRes ? brandsRes.data || [] : [];
  const categories =
    categoriesRes && "data" in categoriesRes ? categoriesRes.data || [] : [];

  return (
    <AdminMetadataContext.Provider
      value={{
        brands,
        categories,
        isLoadingBrands,
        isLoadingCategories,
        mutateBrands: () => mutateBrands(),
        mutateCategories: () => mutateCategories(),
      }}
    >
      {children}
    </AdminMetadataContext.Provider>
  );
}

export function useAdminMetadata() {
  const context = useContext(AdminMetadataContext);
  if (context === undefined) {
    throw new Error(
      "useAdminMetadata must be used within an AdminMetadataProvider"
    );
  }
  return context;
}

export function useAdminBrands() {
  const { brands, isLoadingBrands, mutateBrands } = useAdminMetadata();
  return { brands, isLoading: isLoadingBrands, mutate: mutateBrands };
}

export function useAdminCategories() {
  const { categories, isLoadingCategories, mutateCategories } =
    useAdminMetadata();
  return {
    categories,
    isLoading: isLoadingCategories,
    mutate: mutateCategories,
  };
}
