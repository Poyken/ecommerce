"use client";

import { getBrandsAction, getCategoriesAction } from "@/features/admin/actions";
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
    fallbackData: {
      success: true,
      data: initialBrands,
    } as any,
    revalidateOnFocus: false,
  });

  // Fetch Categories với SWR
  const {
    data: categoriesRes,
    isLoading: isLoadingCategories,
    mutate: mutateCategories,
  } = useSWR("admin-categories", () => getCategoriesAction(), {
    fallbackData: {
      success: true,
      data: initialCategories,
    } as any,
    revalidateOnFocus: false,
  });

  // Extract brands with proper type guard
  const brands = (() => {
    if (!brandsRes || "error" in brandsRes) return [];
    if (Array.isArray(brandsRes.data)) return brandsRes.data;
    return (brandsRes.data as any)?.data || [];
  })();

  // Extract categories with proper type guard
  const categories = (() => {
    if (!categoriesRes || "error" in categoriesRes) return [];
    if (Array.isArray(categoriesRes.data)) return categoriesRes.data;
    return (categoriesRes.data as any)?.data || [];
  })();

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
