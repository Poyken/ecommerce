/**
 * =====================================================================
 * PRODUCT SERVICE - Service Layer cho sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * SERVICE LAYER LÀ GÌ?
 * - Tầng trung gian giữa UI components và API
 * - Đóng gói logic gọi API vào các method có ý nghĩa
 * - Giúp code DRY (Don't Repeat Yourself) - không lặp lại
 *
 * TẠI SAO CẦN SERVICE LAYER?
 * 1. Tái sử dụng: Nhiều component có thể dùng cùng service
 * 2. Dễ test: Mock service thay vì mock HTTP requests
 * 3. Dễ maintain: Thay đổi API chỉ cần sửa 1 chỗ
 * 4. Clean code: Component chỉ cần gọi service, không cần biết về API
 *
 * SO SÁNH VỚI SERVER ACTIONS:
 * ┌──────────────────┬─────────────────────┬────────────────────────┐
 * │                  │ Service             │ Server Action           │
 * ├──────────────────┼─────────────────────┼────────────────────────┤
 * │ Dùng cho         │ Lấy dữ liệu (GET)   │ Thay đổi data (POST...)│
 * │ Caching          │ Next.js cache       │ revalidatePath          │
 * │ Gọi từ           │ Server Components   │ Forms, Client Components│
 * └──────────────────┴─────────────────────┴────────────────────────┘
 * =====================================================================
 */

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Category, Product } from "@/types/models";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Tham số filter và phân trang cho danh sách sản phẩm.
 */
interface GetProductsParams {
  /** Số sản phẩm mỗi trang (default: 12) */
  limit?: number;
  /** Số trang (1-indexed) */
  page?: number;
  /** Từ khóa tìm kiếm theo tên */
  search?: string;
  /** Filter theo ID danh mục */
  categoryId?: string;
  /** Filter theo ID thương hiệu */
  brandId?: string;
  /** List ID sản phẩm (comma separated) */
  ids?: string;
  /** Sắp xếp: "price_asc", "price_desc", "newest", "oldest" */
  sort?: string;
  /** Giá thấp nhất */
  minPrice?: number;
  /** Giá cao nhất */
  maxPrice?: number;
  /** Bao gồm thông tin SKU chi tiết (true/false) */
  includeSkus?: string;
}

const FALLBACK_PRODUCT: Product = {
  id: "fallback",
  name: "Fallback Product",
  slug: "fallback-product",
  description: "This is a placeholder product for build purposes.",
  categoryId: "1",
  brandId: "1",
  category: {
    id: "1",
    name: "Uncategorized",
    slug: "uncategorized",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  brand: {
    id: "1",
    name: "Generic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  options: [],
  skus: [
    {
      id: "sku-1",
      skuCode: "FB-001",
      price: 100000,
      stock: 10,
      productId: "fallback",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      optionValues: [],
    },
  ],
  reviews: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [],
};

// =============================================================================
// 🛍️ PRODUCT SERVICE - Các method xử lý sản phẩm
// =============================================================================

export const productService = {
  /**
   * Lấy danh sách sản phẩm với filter và phân trang.
   *
   * @param params - Tham số filter (limit, page, search, categoryId, sort)
   * @returns { data: Product[], meta: PaginationMeta }
   *
   * @example
   * // Lấy 12 sản phẩm đầu tiên
   * const result = await productService.getProducts({ limit: 12 });
   *
   * @example
   * // Tìm kiếm + filter theo category
   * const result = await productService.getProducts({
   *   search: "iPhone",
   *   categoryId: "phones-category-id",
   *   sort: "-price" // Giá giảm dần
   * });
   */
  async getProducts(
    params?: GetProductsParams,
    options?: { next?: NextFetchRequestConfig }
  ): Promise<ApiResponse<Product[]>> {
    try {
      const response = await http<ApiResponse<Product[]>>("/products", {
        params: params as Record<string, string | number | boolean>,
        skipAuth: true,
        next: {
          revalidate: 0, // Disable cache to ensure fresh data
          tags: ["products"],
          ...options?.next,
        },
      });
      return (
        response || {
          data: [],
          meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
        }
      );
    } catch (error) {
      console.error("Lấy sản phẩm thất bại:", error);
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
      } as any;
    }
  },

  /**
   * Lấy sản phẩm nổi bật cho trang chủ.
   *
   * Đây là wrapper tiện lợi của getProducts(),
   * chỉ lấy số lượng giới hạn và xử lý lỗi gracefully.
   *
   * @param limit - Số sản phẩm muốn lấy (default: 8)
   * @returns Mảng sản phẩm, hoặc mảng rỗng nếu lỗi
   *
   * @example
   * // Trong HomePage component
   * const featuredProducts = await productService.getFeaturedProducts(4);
   */
  async getFeaturedProducts(
    limit = 8,
    options?: { next?: NextFetchRequestConfig }
  ): Promise<Product[]> {
    try {
      const result = await this.getProducts({ limit }, options);
      return result.data || [];
    } catch (error) {
      console.error("Lấy sản phẩm nổi bật thất bại:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách tất cả categories.
   * Dùng cho sidebar filter hoặc navigation menu.
   *
   * @returns Mảng categories, hoặc mảng rỗng nếu lỗi
   *
   * @example
   * // Trong FilterSidebar component
   * const categories = await productService.getCategories();
   */
  async getCategories(options?: {
    next?: NextFetchRequestConfig;
  }): Promise<Category[]> {
    try {
      const response = await http<ApiResponse<Category[]>>("/categories", {
        skipAuth: true,
        next: {
          revalidate: 0,
          tags: ["categories"],
          ...options?.next,
        },
      });

      if (Array.isArray(response?.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Lấy danh mục thất bại:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách tất cả thương hiệu.
   *
   * @returns Mảng thương hiệu, hoặc mảng rỗng nếu lỗi
   */
  async getBrands(options?: {
    next?: NextFetchRequestConfig;
  }): Promise<import("@/types/models").Brand[]> {
    try {
      const response = await http<
        ApiResponse<import("@/types/models").Brand[]>
      >("/brands", {
        skipAuth: true,
        next: {
          revalidate: 0,
          tags: ["brands"],
          ...options?.next,
        },
      });

      if (Array.isArray(response?.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Lấy thương hiệu thất bại:", error);
      return [];
    }
  },

  /**
   * Lấy chi tiết một sản phẩm theo ID.
   *
   * @param id - ID của sản phẩm
   * @returns Đối tượng sản phẩm, hoặc null nếu không tìm thấy
   */
  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await http<ApiResponse<Product>>(`/products/${id}`, {
        skipAuth: true,
        next: {
          revalidate: 0,
          tags: [`product-${id}`],
        },
      });
      return response?.data || null;
    } catch {
      if (id === "fallback") {
        return FALLBACK_PRODUCT;
      }
      return null;
    }
  },

  /**
   * Lấy danh sách ID sản phẩm để generateStaticParams (SSG).
   *
   * @returns Mảng các ID sản phẩm
   */
  async getProductIds(): Promise<string[]> {
    try {
      const result = await this.getProducts({ limit: 100, sort: "newest" });
      return result?.data?.map((p) => p.id) || [];
    } catch (error) {
      console.error("Lấy danh sách ID sản phẩm thất bại:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách ID danh mục để generateStaticParams (SSG).
   */
  async getCategoryIds(): Promise<string[]> {
    try {
      const categories = await this.getCategories();
      return categories.map((c) => c.id);
    } catch (error) {
      console.error("Lấy danh sách ID danh mục thất bại:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách ID thương hiệu để generateStaticParams (SSG).
   */
  async getBrandIds(): Promise<string[]> {
    try {
      const brands = await this.getBrands();
      return brands.map((b) => b.id);
    } catch (error) {
      console.error("Lấy danh sách ID thương hiệu thất bại:", error);
      return [];
    }
  },
};
