"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import {
  ApiResponse,
  ActionResult,
  CreateBrandDto,
  CreateCategoryDto,
  CreateCouponDto,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateCouponDto,
} from "@/types/dtos";
import { Brand, Category, Coupon } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

// --- BRANDS ---

export async function getBrandsAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Brand[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);
  return wrapServerAction(
    () => http<ApiResponse<Brand[]>>("/brands", { params }),
    "Failed to fetch brands"
  );
}

export async function createBrandAction(
  data: CreateBrandDto | FormData
): Promise<ActionResult<Brand>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Brand>>("/brands", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    REVALIDATE.admin.brands();
    return res.data;
  }, "Failed to create brand");
}

export async function updateBrandAction(
  id: string,
  data: UpdateBrandDto | FormData
): Promise<ActionResult<Brand>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Brand>>(`/brands/${id}`, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    REVALIDATE.admin.brands();
    return res.data;
  }, "Failed to update brand");
}

export async function deleteBrandAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/brands/${id}`, { method: "DELETE" });
    REVALIDATE.admin.brands();
  }, "Failed to delete brand");
}

// --- CATEGORIES ---

export async function getCategoriesAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Category[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);
  return wrapServerAction(
    () => http<ApiResponse<Category[]>>("/categories", { params }),
    "Failed to fetch categories"
  );
}

export async function createCategoryAction(
  data: CreateCategoryDto | FormData
): Promise<ActionResult<Category>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Category>>("/categories", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    REVALIDATE.admin.categories();
    return res.data;
  }, "Failed to create category");
}

export async function updateCategoryAction(
  id: string,
  data: UpdateCategoryDto | FormData
): Promise<ActionResult<Category>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Category>>(`/categories/${id}`, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    REVALIDATE.admin.categories();
    return res.data;
  }, "Failed to update category");
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/categories/${id}`, { method: "DELETE" });
    REVALIDATE.admin.categories();
  }, "Failed to delete category");
}

// --- COUPONS ---

export async function getCouponsAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Coupon[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);
  return wrapServerAction(
    () => http<ApiResponse<Coupon[]>>("/coupons", { params }),
    "Failed to fetch coupons"
  );
}

export async function createCouponAction(
  data: CreateCouponDto
): Promise<ActionResult<Coupon>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Coupon>>("/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.coupons();
    return res.data;
  }, "Failed to create coupon");
}

export async function updateCouponAction(
  id: string,
  data: UpdateCouponDto
): Promise<ActionResult<Coupon>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Coupon>>(`/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.coupons();
    return res.data;
  }, "Failed to update coupon");
}

export async function deleteCouponAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/coupons/${id}`, { method: "DELETE" });
    REVALIDATE.admin.coupons();
  }, "Failed to delete coupon");
}
