"use server";

import { http } from "@/lib/http";
import {
  ApiResponse,
  ActionResult,
  CreateProductDto,
  UpdateProductDto,
  UpdateSkuDto,
} from "@/types/dtos";
import { Product, ProductTranslation, Sku } from "@/types/models";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/server-action-wrapper";

/**
 * =====================================================================
 * PRODUCT & SKU ACTIONS - Quản lý sản phẩm, biến thể & nội dung AI
 * =====================================================================
 */

/**
 * Helper to normalize arguments for list actions
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

// --- PRODUCTS ---

export async function getProductsAction(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Promise<ActionResult<Product[]>> {
  const params = normalizeParams(paramsOrPage, limit, search);
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
    revalidatePath("/admin/products", "page");
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
    revalidatePath("/admin/products", "page");
    return res.data;
  }, "Failed to update product");
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/products/${id}`, { method: "DELETE" });
    revalidatePath("/admin/products", "page");
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
  let params: any = {};
  if (
    typeof paramsOrPage === "object" &&
    paramsOrPage !== null &&
    !Array.isArray(paramsOrPage)
  ) {
    params = paramsOrPage;
  } else {
    params = { page: paramsOrPage, limit, status, search, stockLimit };
  }

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
    revalidatePath("/admin/products", "page");
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
      `/product-translations/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    revalidatePath("/admin/products", "page");
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
