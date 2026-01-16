/**
 * =====================================================================
 * PRODUCT SERVICE - Service Layer cho sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * SERVICE LAYER LÀ GÌ?
 * - Là tầng trung gian giữa Component (UI) và API (Backend).
 * - Thay vì gọi `fetch` trực tiếp trong component (rất lộn xộn và khó test), ta gói logic vào đây.
 *
 * TẠI SAO CẦN SERVICE LAYER?
 * 1. TÁI SỬ DỤNG (Reusability): Một API `getProduct` có thể được gọi từ HomePage, ProductPage, CartPage...
 * 2. DỄ BẢO TRÌ (Maintainability): Nếu Backend đổi đường dẫn API từ `/api/v1/product` sang `/api/v2/items`, ta chỉ cần sửa trong file này, không cần tìm sửa hàng chục component.
 * 3. CACHING CONTROL: Centralized logic để điều khiển việc cache của Next.js (revalidate, tags).
 *
 * SO SÁNH VỚI SERVER ACTIONS:
 * ┌──────────────────┬─────────────────────┬────────────────────────┐
 * │                  │ Service             │ Server Action           │
 * ├──────────────────┼─────────────────────┼────────────────────────┤
 * │ Mục đích         │ Lấy dữ liệu (GET)   │ Gửi dữ liệu (POST/PUT)  │
 * │ Chạy ở           │ Server & Client     │ Chỉ chạy trên Server    │
 * │ Caching          │ Next.js fetch cache │ revalidatePath/revalidateTag|
 * └──────────────────┴─────────────────────┴────────────────────────┘ *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - SEO Optimization: Tích hợp với Next.js SSG/ISR để pre-render trang sản phẩm, giúp Google Index cực nhanh.
 * - User Experience: Cache thông minh (Category cache 24h, Product cache 60s) giúp trang load gần như tức thì nhưng giá cả vẫn cập nhật.

 * =====================================================================
 */

import { http } from "@/lib/http";
import { ApiResponse, PaginatedData } from "@/types/dtos";
import { Brand, Category, Product, Sku } from "@/types/models";
import { unstable_cache } from "next/cache";
import { cache } from "react";

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
  getProducts: cache(
    async (
      params?: GetProductsParams,
      options?: { next?: NextFetchRequestConfig }
    ): Promise<ApiResponse<Product[]>> => {
      try {
        // Create a unique cache key based on params
        const cacheKey = JSON.stringify(params || {});

        const response = await http.get<ApiResponse<Product[]>>("/products", {
          params: params as any, // Cast to any temporarily to avoid strict type mismatch with FetchOptions params
          skipAuth: true,
          next: {
            revalidate: 60,
            tags: ["products", `products-${cacheKey}`],
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
        } as unknown as ApiResponse<Product[]>;
      }
    }
  ),

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
  getCategories: cache(
    async (options?: {
      next?: NextFetchRequestConfig;
      limit?: number;
      page?: number;
    }): Promise<Category[]> => {
      const { limit, page, next } = options || {};
      const params = { limit, page };

      const fetcher = unstable_cache(
        async () => {
          try {
            const response = await http.get<
              ApiResponse<Category[]> | ApiResponse<PaginatedData<Category>>
            >("/categories", {
              params: params as any,
              skipAuth: true,
              next: {
                revalidate: 86400, // [P11 OPTIMIZATION] Cache 24h - categories change very rarely
                tags: ["categories"],
                ...next,
              },
            });

            // Handle direct array in data
            if (Array.isArray(response?.data)) {
              return response.data;
            }
            // Handle nested data in paginated response
            if (
              response?.data &&
              "data" in response.data &&
              Array.isArray(response.data.data)
            ) {
              return response.data.data;
            }
            return [];
          } catch (error) {
            console.error("Lấy danh mục thất bại:", error);
            return [];
          }
        },
        ["categories-all", JSON.stringify(params)],
        {
          revalidate: 86400,
          tags: ["categories"],
        }
      );

      return fetcher();
    }
  ),

  /**
   * Lấy danh sách tất cả thương hiệu.
   *
   * @returns Mảng thương hiệu, hoặc mảng rỗng nếu lỗi
   */
  getBrands: cache(
    async (options?: {
      next?: NextFetchRequestConfig;
      limit?: number;
      page?: number;
    }): Promise<import("@/types/models").Brand[]> => {
      const { limit, page, next } = options || {};
      const params = { limit, page };

      const fetcher = unstable_cache(
        async () => {
          try {
            const response = await http.get<
              | ApiResponse<import("@/types/models").Brand[]>
              | ApiResponse<PaginatedData<import("@/types/models").Brand>>
            >("/brands", {
              params: params as any,
              skipAuth: true,
              next: {
                revalidate: 86400, // [P11 OPTIMIZATION] Cache 24h - brands change very rarely
                tags: ["brands"],
                ...next,
              },
            });

            // Handle direct array in data
            if (Array.isArray(response?.data)) {
              return response.data;
            }
            // Handle nested data in paginated response
            if (
              response?.data &&
              "data" in response.data &&
              Array.isArray(response.data.data)
            ) {
              return response.data.data;
            }
            return [];
          } catch (error) {
            console.error("Lấy thương hiệu thất bại:", error);
            return [];
          }
        },
        ["brands-all", JSON.stringify(params)],
        {
          revalidate: 86400,
          tags: ["brands"],
        }
      );

      return fetcher();
    }
  ),

  /**
   * Lấy chi tiết một sản phẩm theo ID.
   *
   * @param id - ID của sản phẩm
   * @returns Đối tượng sản phẩm, hoặc null nếu không tìm thấy
   */
  /**
   * Lấy chi tiết một sản phẩm theo ID.
   *
   * @param id - ID của sản phẩm
   * @returns Đối tượng sản phẩm, hoặc null nếu không tìm thấy
   */
  getProduct: cache(async (id: string): Promise<Product | null> => {
    try {
      const response = await http.get<ApiResponse<Product>>(`/products/${id}`, {
        skipAuth: true,
        next: {
          revalidate: 0, // Disable cache to ensure real-time stock
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
  }),

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
  /**
   * Lấy danh sách sản phẩm mới về.
   */
  async getNewArrivals(limit = 8): Promise<Product[]> {
    try {
      const response = await http.get<ApiResponse<Product[]>>("/products", {
        params: { limit, sort: "-createdAt" },
        skipAuth: true,
        next: { revalidate: 300, tags: ["products"] },
      });
      return response?.data || [];
    } catch (error) {
      console.error("Lấy sản phẩm mới thất bại:", error);
      return [];
    }
  },

  /**
   * Lấy chi tiết một danh mục theo ID.
   */
  async getCategory(id: string): Promise<Category | null> {
    try {
      const response = await http.get<ApiResponse<Category>>(
        `/categories/${id}`,
        {
          skipAuth: true,
          next: { revalidate: 3600, tags: [`category-${id}`] },
        }
      );
      return response?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Lấy chi tiết một thương hiệu theo ID.
   */
  async getBrand(id: string): Promise<Brand | null> {
    try {
      const response = await http.get<ApiResponse<Brand>>(`/brands/${id}`, {
        skipAuth: true,
        next: { revalidate: 3600, tags: [`brand-${id}`] },
      });
      return response?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Lấy chi tiết SKU.
   */
  async getSku(id: string): Promise<Sku | null> {
    try {
      const response = await http.get<ApiResponse<Sku>>(`/skus/${id}`, {
        skipAuth: true,
        next: { revalidate: 60, tags: [`sku-${id}`] },
      });
      return response?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Lấy các sản phẩm liên quan.
   */
  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    try {
      const response = await http.get<ApiResponse<Product[]>>(
        `/products/${productId}/related`,
        {
          params: { limit },
          skipAuth: true,
          next: { revalidate: 300, tags: [`product-${productId}-related`] },
        }
      );
      return response?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Export dữ liệu sản phẩm ra file Excel.
   * Dùng `window.open` hoặc `fetch` blob để tải file.
   */
  async exportToExcel(): Promise<void> {
    try {
      const response = await http.get<Blob>("/products/export/excel", {
        skipAuth: false, // Cần quyền Admin
        responseType: "blob",
      });

      // Tạo link download ảo
      const url = window.URL.createObjectURL(new Blob([response as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `products_export_${new Date().getTime()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Export thất bại:", error);
      throw error;
    }
  },

  /**
   * Tải Template nhập liệu mẫu.
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await http.get<Blob>("/products/import/template", {
        skipAuth: false,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Tải template thất bại:", error);
      throw error;
    }
  },

  /**
   * Import dữ liệu từ file Excel.
   */
  async importFromExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    return http.post("/products/import/excel", formData, {
      skipAuth: false,
    });
  },
};
