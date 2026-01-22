/**
 * PRODUCT SERVER ACTIONS - Logic nghiệp vụ Sản phẩm
 */

"use server";

import { ActionResult } from "@/types/dtos";
import { Brand, Category, Product } from "@/types/models";
import { actionClient, wrapServerAction } from "@/lib/safe-action";
import { productService } from "./services/product.service";
import { GetProductsSchema, ProductIdSchema, LimitSchema } from "./schemas";
import { createActionWrapper } from "@/lib/safe-action";

// =============================================================================
// 📦 PRODUCT ACTIONS
// =============================================================================

/**
 * Lấy danh sách sản phẩm với filter và phân trang
 */
const safeGetProducts = actionClient
  .schema(GetProductsSchema)
  .action(async ({ parsedInput }) => {
    return productService.getProducts(parsedInput);
  });

export const getProductsAction = createActionWrapper(safeGetProducts, "Failed to fetch products");

/**
 * Lấy chi tiết một sản phẩm
 */
const safeGetProduct = actionClient
  .schema(ProductIdSchema)
  .action(async ({ parsedInput }) => {
    const product = await productService.getProduct(parsedInput.id);
    return product || null;
  });

export const getProductAction = createActionWrapper(safeGetProduct, "Failed to fetch product");

/**
 * Lấy danh sách sản phẩm nổi bật
 */
const safeGetFeaturedProducts = actionClient
  .schema(LimitSchema)
  .action(async ({ parsedInput }) => {
    return productService.getFeaturedProducts(parsedInput.limit);
  });

export const getFeaturedProductsAction = createActionWrapper(safeGetFeaturedProducts, "Failed to fetch featured products");

/**
 * Lấy danh sách sản phẩm mới nhất
 */
const safeGetNewestProducts = actionClient
  .schema(LimitSchema)
  .action(async ({ parsedInput }) => {
    return productService.getNewArrivals(parsedInput.limit);
  });

export const getNewestProductsAction = createActionWrapper(safeGetNewestProducts, "Failed to fetch new arrivals");

/**
 * Lấy danh sách sản phẩm bán chạy
 */
const safeGetBestSellingProducts = actionClient
  .schema(LimitSchema)
  .action(async ({ parsedInput }) => {
    return productService.getFeaturedProducts(parsedInput.limit);
  });

export const getBestSellingProductsAction = createActionWrapper(safeGetBestSellingProducts, "Failed to fetch best selling products");

// =============================================================================
// 🏷️ CATEGORY ACTIONS
// =============================================================================

export const getCategoriesAction = async (): Promise<ActionResult<Category[]>> => {
  return wrapServerAction(
    () => productService.getCategories(),
    "Failed to fetch categories"
  );
};

const safeGetCategory = actionClient
  .schema(ProductIdSchema)
  .action(async ({ parsedInput }) => {
    const category = await productService.getCategory(parsedInput.id);
    return category || null;
  });

export const getCategoryAction = createActionWrapper(safeGetCategory, "Failed to fetch category");

// =============================================================================
// 🏢 BRAND ACTIONS
// =============================================================================

export const getBrandsAction = async (): Promise<ActionResult<Brand[]>> => {
  return wrapServerAction(
    () => productService.getBrands(),
    "Failed to fetch brands"
  );
};

const safeGetBrand = actionClient
  .schema(ProductIdSchema)
  .action(async ({ parsedInput }) => {
    const brand = await productService.getBrand(parsedInput.id);
    return brand || null;
  });

export const getBrandAction = createActionWrapper(safeGetBrand, "Failed to fetch brand");

// =============================================================================
// 🔧 HELPER ACTIONS (For SSG)
// =============================================================================

export async function getProductIdsAction(): Promise<string[]> {
  try {
    return await productService.getProductIds();
  } catch {
    return [];
  }
}

export async function getCategoryIdsAction(): Promise<string[]> {
  try {
    return await productService.getCategoryIds();
  } catch {
    return [];
  }
}

export async function getBrandIdsAction(): Promise<string[]> {
  try {
    return await productService.getBrandIds();
  } catch {
    return [];
  }
}

