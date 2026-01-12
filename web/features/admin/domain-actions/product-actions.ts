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

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import {
  ApiResponse,
  ActionResult,
  CreateProductDto,
  UpdateProductDto,
  UpdateSkuDto,
} from "@/types/dtos";
import { Product, ProductTranslation, Sku } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

// --- PRODUCTS ---

export async function getProductsAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Product[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);
  return wrapServerAction(
    () => http<ApiResponse<Product[]>>("/products", { params }),
    "Failed to fetch products"
  );
}

export async function createProductAction(
  data: CreateProductDto
): Promise<ActionResult<Product>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Product>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to create product");
}

export async function updateProductAction(
  id: string,
  data: UpdateProductDto
): Promise<ActionResult<Product>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Product>>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.products();
    REVALIDATE.products(id);
    return res.data;
  }, "Failed to update product");
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/products/${id}`, { method: "DELETE" });
    REVALIDATE.admin.products();
  }, "Failed to delete product");
}

// --- SKUS ---

export async function getSkusAction(
  paramsOrPage: any = 1,
  limit: number = 10,
  status?: string,
  search?: string,
  stockLimit?: number
): Promise<ActionResult<Sku[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);
  if (status) params.status = status;
  if (stockLimit) params.stockLimit = stockLimit;

  return wrapServerAction(
    () => http<ApiResponse<Sku[]>>("/skus", { params }),
    "Failed to fetch SKUs"
  );
}

export async function updateSkuAction(
  id: string,
  data: UpdateSkuDto | FormData
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>(`/skus/${id}`, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to update SKU");
}

// --- TRANSLATIONS (Product-specific) ---

export async function getProductTranslationsAction(
  productId: string
): Promise<ActionResult<ProductTranslation[]>> {
  return wrapServerAction(
    () =>
      http<ApiResponse<ProductTranslation[]>>(
        `/products/${productId}/translations`
      ),
    "Failed to fetch translations"
  );
}

export async function updateProductTranslationAction(
  id: string,
  data: any
): Promise<ActionResult<ProductTranslation>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<ProductTranslation>>(
      `/products/${id}/translations`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    REVALIDATE.admin.products();
    return res.data;
  }, "Failed to update translation");
}

// --- AI AUTOMATION ---

export async function generateProductContentAction(data: {
  productName: string;
  categoryName: string;
  brandName?: string;
}): Promise<ActionResult<any>> {
  return wrapServerAction(
    () =>
      http<ApiResponse<any>>("/ai-automation/generate-product-content", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    "Failed to generate content"
  );
}

export async function translateTextAction(data: {
  text: string;
  targetLocale: string;
}): Promise<ActionResult<{ text: string; locale: string }>> {
  return wrapServerAction(
    () =>
      http<ApiResponse<{ text: string; locale: string }>>(
        "/ai-automation/translate",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    "Failed to translate text"
  );
}
