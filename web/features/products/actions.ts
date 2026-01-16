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
 *
 * =====================================================================
 */

"use server";

import { ApiResponse, ActionResult } from "@/types/dtos";
import { Brand, Category, Product } from "@/types/models";
import { wrapServerAction } from "@/lib/safe-action";
import { productService } from "./services/product.service";

// =============================================================================
// 📦 PRODUCT ACTIONS
// =============================================================================

/**
 * Lấy danh sách sản phẩm với filter và phân trang
 */
export async function getProductsAction(
  params?: {
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
): Promise<ActionResult<{ data: Product[]; meta: any }>> {
  return wrapServerAction(
    async () => {
      const response = await productService.getProducts(params);
      return {
        data: response.data || [],
        meta: response.meta || { total: 0, page: 1, limit: 10, lastPage: 0 },
      };
    },
    "Failed to fetch products"
  );
}

/**
 * Lấy chi tiết một sản phẩm
 */
export async function getProductAction(
  id: string
): Promise<ActionResult<Product | null>> {
  return wrapServerAction(
    async () => {
      const product = await productService.getProduct(id);
      if (!product) {
        return null;
      }
      return product;
    },
    "Failed to fetch product"
  );
}

/**
 * Lấy danh sách sản phẩm nổi bật
 */
export async function getFeaturedProductsAction(
  limit: number = 12
): Promise<ActionResult<Product[]>> {
  return wrapServerAction(
    () => productService.getFeaturedProducts(limit),
    "Failed to fetch featured products"
  );
}

/**
 * Lấy danh sách sản phẩm mới nhất
 */
export async function getNewestProductsAction(
  limit: number = 12
): Promise<ActionResult<Product[]>> {
  return wrapServerAction(
    () => productService.getNewestProducts(limit),
    "Failed to fetch newest products"
  );
}

/**
 * Lấy danh sách sản phẩm bán chạy
 */
export async function getBestSellingProductsAction(
  limit: number = 12
): Promise<ActionResult<Product[]>> {
  return wrapServerAction(
    () => productService.getBestSellingProducts(limit),
    "Failed to fetch best selling products"
  );
}

// =============================================================================
// 🏷️ CATEGORY ACTIONS
// =============================================================================

/**
 * Lấy danh sách tất cả categories
 */
export async function getCategoriesAction(): Promise<ActionResult<Category[]>> {
  return wrapServerAction(
    () => productService.getCategories(),
    "Failed to fetch categories"
  );
}

/**
 * Lấy chi tiết một category
 */
export async function getCategoryAction(
  id: string
): Promise<ActionResult<Category | null>> {
  return wrapServerAction(
    async () => {
      const category = await productService.getCategory(id);
      if (!category) {
        return null;
      }
      return category;
    },
    "Failed to fetch category"
  );
}

// =============================================================================
// 🏢 BRAND ACTIONS
// =============================================================================

/**
 * Lấy danh sách tất cả brands
 */
export async function getBrandsAction(): Promise<ActionResult<Brand[]>> {
  return wrapServerAction(
    () => productService.getBrands(),
    "Failed to fetch brands"
  );
}

/**
 * Lấy chi tiết một brand
 */
export async function getBrandAction(
  id: string
): Promise<ActionResult<Brand | null>> {
  return wrapServerAction(
    async () => {
      const brand = await productService.getBrand(id);
      if (!brand) {
        return null;
      }
      return brand;
    },
    "Failed to fetch brand"
  );
}

// =============================================================================
// 🔧 HELPER ACTIONS (For generateStaticParams)
// =============================================================================

/**
 * Lấy danh sách ID sản phẩm để generateStaticParams (SSG)
 */
export async function getProductIdsAction(): Promise<string[]> {
  try {
    const result = await productService.getProductIds();
    return result;
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách ID categories để generateStaticParams (SSG)
 */
export async function getCategoryIdsAction(): Promise<string[]> {
  try {
    const result = await productService.getCategoryIds();
    return result;
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách ID brands để generateStaticParams (SSG)
 */
export async function getBrandIdsAction(): Promise<string[]> {
  try {
    const result = await productService.getBrandIds();
    return result;
  } catch {
    return [];
  }
}
