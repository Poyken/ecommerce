/**
 * =====================================================================
 * PRODUCT SERVER ACTIONS - Xử lý logic nghiệp vụ Sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. "use server":
 * - Đánh dấu file này chỉ chạy trên Server. Các export functions ở đây có thể được gọi
 *   trực tiếp từ Client Components (RPC - Remote Procedure Call).
 *
 * 2. ACTION WRAPPER (`wrapServerAction`):
 * - Wrap mọi action trong `try-catch` để xử lý lỗi tập trung.
 * - Đảm bảo trả về format thống nhất `ActionResult<T>`.
 *
 * 3. REVALIDATION (Cache Invalidation):
 * - Khi Thêm/Sửa/Xóa (`create`, `update`, `delete`), ta phải gọi `REVALIDATE`.
 * - Mục đích: Xóa cache cũ của Next.js để user thấy dữ liệu mới ngay lập tức.
 * - VD: `REVALIDATE.admin.products()` sẽ báo Next.js fetch lại list sản phẩm ở trang Admin. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - AI Content Generation: Tích hợp AI để tự động tạo mô tả sản phẩm và dịch thuật đa ngôn ngữ (Localization), giúp tiết kiệm thời gian chuẩn bị dữ liệu bán hàng.
 * - Omni-channel Inventory Management: Theo dõi và cập nhật trạng thái kho hàng (SKUs) theo thời gian thực, đảm bảo dữ liệu sản phẩm luôn đồng nhất trên mọi kênh bán hàng.
 *
 * =====================================================================
 */
"use server";

import {
  ApiResponse,
  ActionResult,
  CreateProductDto,
  UpdateProductDto,
  UpdateSkuDto,
} from "@/types/dtos";
import { Product, ProductTranslation, Sku } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { PaginationParams } from "@/lib/utils";
import { FileExportResult } from "@/types/feature-types/admin.types";

import { adminProductService } from "../services/admin-product.service";

// --- PRODUCTS ---

export async function getProductsAction(
  paramsOrPage?: number | PaginationParams,
  limit?: number,
  search?: string
): Promise<ActionResult<Product[]>> {
  return wrapServerAction(
    () => adminProductService.getProducts(paramsOrPage, limit, search),
    "Failed to fetch products"
  );
}

export async function createProductAction(
  data: CreateProductDto
): Promise<ActionResult<Product>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.createProduct(data);
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to create product");
}

export async function updateProductAction(
  id: string,
  data: UpdateProductDto
): Promise<ActionResult<Product>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.updateProduct(id, data);
    REVALIDATE.admin.products();
    REVALIDATE.products(id);
    return res.data;
  }, "Failed to update product");
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminProductService.deleteProduct(id);
    REVALIDATE.admin.products();
  }, "Failed to delete product");
}

// --- SKUS ---

export async function getSkusAction(
  paramsOrPage: number | PaginationParams = 1,
  limit: number = 10,
  status?: string,
  search?: string,
  stockLimit?: number
): Promise<ActionResult<Sku[]>> {
  return wrapServerAction(
    () =>
      adminProductService.getSkus(
        paramsOrPage,
        limit,
        status,
        search,
        stockLimit
      ),
    "Failed to fetch SKUs"
  );
}

export async function updateSkuAction(
  id: string,
  data: UpdateSkuDto | FormData
): Promise<ActionResult<Sku>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.updateSku(id, data);
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to update SKU");
}

// --- TRANSLATIONS (Product-specific) ---

export async function getProductTranslationsAction(
  productId: string
): Promise<ActionResult<ProductTranslation[]>> {
  return wrapServerAction(
    () => adminProductService.getProductTranslations(productId),
    "Failed to fetch translations"
  );
}

export async function updateProductTranslationAction(
  id: string,
  data: Partial<ProductTranslation>
): Promise<ActionResult<ProductTranslation>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.updateProductTranslation(id, data);
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to update translation");
}

// --- AI AUTOMATION ---

export async function generateProductContentAction(data: {
  productName: string;
  categoryName: string;
  brandName?: string;
}): Promise<
  ActionResult<{
    description: string;
    metaTitle: string;
    metaDescription: string;
  }>
> {
  return wrapServerAction(
    () => adminProductService.generateProductContent(data),
    "Failed to generate content"
  );
}

export async function translateTextAction(data: {
  text: string;
  targetLocale: string;
}): Promise<ActionResult<{ text: string; locale: string }>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.translateText(data);
    return res.data;
  });
}

// --- IMPORT & EXPORT ---

export async function exportProductsAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminProductService.exportProducts();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      filename: `products_export_${Date.now()}.xlsx`,
    };
  }, "Failed to export products");
}

export async function importProductsAction(
  formData: FormData
): Promise<ActionResult<{ imported: number }>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.importProducts(formData);
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to import products");
}

export async function previewProductsImportAction(
  formData: FormData
): Promise<ActionResult<Product[]>> {
  return wrapServerAction(async () => {
    const res = await adminProductService.previewProductsImport(formData);
    return res.data;
  }, "Failed to preview product import");
}

export async function downloadProductTemplateAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminProductService.downloadProductTemplate();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      filename: "product_import_template.xlsx",
    };
  }, "Failed to download template");
}
