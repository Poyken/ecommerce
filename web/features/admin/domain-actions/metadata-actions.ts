
"use server";

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
import { PaginationParams } from "@/lib/utils";
import { FileExportResult } from "@/types/feature-types/admin.types";

import { adminMetadataService } from "../services/admin-metadata.service";

/**
 * =====================================================================
 * METADATA ACTIONS - Quản lý Danh mục, Thương hiệu, Coupon
 * =====================================================================
 */

// --- BRANDS ---

export async function getBrandsAction(
  paramsOrPage?: number | PaginationParams,
  limit?: number,
  search?: string
): Promise<ActionResult<Brand[]>> {
  return wrapServerAction(
    () => adminMetadataService.getBrands(paramsOrPage, limit, search),
    "Failed to fetch brands"
  );
}

export async function createBrandAction(
  data: CreateBrandDto | FormData
): Promise<ActionResult<Brand>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.createBrand(data);
    REVALIDATE.admin.brands();
    return res.data;
  }, "Failed to create brand");
}

export async function updateBrandAction(
  id: string,
  data: UpdateBrandDto | FormData
): Promise<ActionResult<Brand>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.updateBrand(id, data);
    REVALIDATE.admin.brands();
    return res.data;
  }, "Failed to update brand");
}

export async function deleteBrandAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminMetadataService.deleteBrand(id);
    REVALIDATE.admin.brands();
  }, "Failed to delete brand");
}

// --- CATEGORIES ---

export async function getCategoriesAction(
  paramsOrPage?: number | PaginationParams,
  limit?: number,
  search?: string
): Promise<ActionResult<Category[]>> {
  return wrapServerAction(
    () => adminMetadataService.getCategories(paramsOrPage, limit, search),
    "Failed to fetch categories"
  );
}

export async function createCategoryAction(
  data: CreateCategoryDto | FormData
): Promise<ActionResult<Category>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.createCategory(data);
    REVALIDATE.admin.categories();
    return res.data;
  }, "Failed to create category");
}

export async function updateCategoryAction(
  id: string,
  data: UpdateCategoryDto | FormData
): Promise<ActionResult<Category>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.updateCategory(id, data);
    REVALIDATE.admin.categories();
    return res.data;
  }, "Failed to update category");
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminMetadataService.deleteCategory(id);
    REVALIDATE.admin.categories();
  }, "Failed to delete category");
}

// --- COUPONS ---

export async function getCouponsAction(
  paramsOrPage?: number | PaginationParams,
  limit?: number,
  search?: string
): Promise<ActionResult<Coupon[]>> {
  return wrapServerAction(
    () => adminMetadataService.getCoupons(paramsOrPage, limit, search),
    "Failed to fetch coupons"
  );
}

export async function createCouponAction(
  data: CreateCouponDto
): Promise<ActionResult<Coupon>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.createCoupon(data);
    REVALIDATE.admin.coupons();
    return res.data;
  }, "Failed to create coupon");
}

export async function updateCouponAction(
  id: string,
  data: UpdateCouponDto
): Promise<ActionResult<Coupon>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.updateCoupon(id, data);
    REVALIDATE.admin.coupons();
    return res.data;
  }, "Failed to update coupon");
}

export async function deleteCouponAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminMetadataService.deleteCoupon(id);
    REVALIDATE.admin.coupons();
  }, "Failed to delete coupon");
}

// --- IMPORT & EXPORT (CATEGORIES) ---

export async function exportCategoriesAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminMetadataService.exportCategories();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      filename: `categories_export_${Date.now()}.xlsx`,
    };
  }, "Failed to export categories");
}

export async function importCategoriesAction(
  formData: FormData
): Promise<ActionResult<{ imported: number }>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.importCategories(formData);
    REVALIDATE.admin.categories();
    return res.data;
  }, "Failed to import categories");
}

export async function previewCategoriesImportAction(
  formData: FormData
): Promise<ActionResult<Category[]>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.previewCategoriesImport(formData);
    return res.data;
  }, "Failed to preview categories import");
}

export async function downloadCategoryTemplateAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminMetadataService.downloadCategoryTemplate();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      filename: "categories_import_template.xlsx",
    };
  }, "Failed to download template");
}

// --- IMPORT & EXPORT (BRANDS) ---

export async function exportBrandsAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminMetadataService.exportBrands();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      filename: `brands_export_${Date.now()}.xlsx`,
    };
  }, "Failed to export brands");
}

export async function importBrandsAction(
  formData: FormData
): Promise<ActionResult<{ imported: number }>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.importBrands(formData);
    REVALIDATE.admin.brands();
    return res.data;
  }, "Failed to import brands");
}

export async function previewBrandsImportAction(
  formData: FormData
): Promise<ActionResult<Brand[]>> {
  return wrapServerAction(async () => {
    const res = await adminMetadataService.previewBrandsImport(formData);
    return res.data;
  }, "Failed to preview brands import");
}

export async function downloadBrandTemplateAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminMetadataService.downloadBrandTemplate();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      filename: "brands_import_template.xlsx",
    };
  }, "Failed to download template");
}
