"use server";

import { http } from "@/lib/http";
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
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/safe-action-utils";

/**
 * =====================================================================
 * MARKETING & METADATA ACTIONS - Quản lý thương hiệu, danh mục, mã giảm giá
 * =====================================================================
 */

/**
 * Helper to normalize arguments that could be either an object or positional params (page, limit, search)
 */
function normalizeParams(paramsOrPage?: any, limit?: number, search?: string) {
  if (
    typeof paramsOrPage === "object" &&
    paramsOrPage !== null &&
    !Array.isArray(paramsOrPage)
  ) {
    return paramsOrPage;
  }
  return { page: paramsOrPage, limit, search };
}

// --- BRANDS ---

export async function getBrandsAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Brand[]>> {
  const params = normalizeParams(paramsOrPage, limit, search);
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
    revalidatePath("/admin/brands", "page");
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
    revalidatePath("/admin/brands", "page");
    return res.data;
  }, "Failed to update brand");
}

export async function deleteBrandAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/brands/${id}`, { method: "DELETE" });
    revalidatePath("/admin/brands", "page");
  }, "Failed to delete brand");
}

// --- CATEGORIES ---

export async function getCategoriesAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Category[]>> {
  const params = normalizeParams(paramsOrPage, limit, search);
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
    revalidatePath("/admin/categories", "page");
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
    revalidatePath("/admin/categories", "page");
    return res.data;
  }, "Failed to update category");
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/categories/${id}`, { method: "DELETE" });
    revalidatePath("/admin/categories", "page");
  }, "Failed to delete category");
}

// --- COUPONS ---

export async function getCouponsAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Coupon[]>> {
  const params = normalizeParams(paramsOrPage, limit, search);
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
    revalidatePath("/admin/coupons", "page");
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
    revalidatePath("/admin/coupons", "page");
    return res.data;
  }, "Failed to update coupon");
}

export async function deleteCouponAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/coupons/${id}`, { method: "DELETE" });
    revalidatePath("/admin/coupons", "page");
  }, "Failed to delete coupon");
}
