/**
 * Product Service - Server-side data fetching for products
 */
import { http } from "@/lib/http";
import { ApiResponse, PaginationMeta } from "@/types/dtos";
import { Brand, Category, Product, Sku } from "@/types/models";

// Type alias - Product with full relations is just Product
type ProductWithVariants = Product;

interface ProductsResponse {
  data: Product[];
  meta: PaginationMeta;
}

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  featured?: boolean;
  includeSkus?: string | boolean;
}

export const productService = {
  /**
   * Get paginated products with filters
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filters.page || 1,
      limit: filters.limit || 12,
      search: filters.search,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      featured: filters.featured,
      includeSkus: filters.includeSkus,
    };

    const response = await http<ApiResponse<Product[]>>("/products", {
      params,
      skipAuth: true,
      next: { revalidate: 60 },
    });

    return {
      data: response.data || [],
      meta: response.meta || { page: 1, limit: 12, total: 0, lastPage: 1 },
    };
  },

  /**
   * Get a single product by ID with full details
   */
  async getProduct(id: string): Promise<ProductWithVariants | null> {
    try {
      const response = await http<ApiResponse<ProductWithVariants>>(
        `/products/${id}`,
        {
          skipAuth: true,
          next: { revalidate: 60 },
        }
      );
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const response = await http<ApiResponse<Product[]>>("/products", {
      params: { limit, featured: true },
      skipAuth: true,
      next: { revalidate: 300 },
    });
    return response.data || [];
  },

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit = 8): Promise<Product[]> {
    const response = await http<ApiResponse<Product[]>>("/products", {
      params: { limit, sort: "-createdAt" },
      skipAuth: true,
      next: { revalidate: 300 },
    });
    return response.data || [];
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await http<ApiResponse<Category[]>>("/categories", {
      skipAuth: true,
      next: { revalidate: 3600 },
    });
    return response.data || [];
  },

  /**
   * Get single category by ID
   */
  async getCategory(id: string): Promise<Category | null> {
    try {
      const response = await http<ApiResponse<Category>>(`/categories/${id}`, {
        skipAuth: true,
        next: { revalidate: 3600 },
      });
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all brands
   */
  async getBrands(): Promise<Brand[]> {
    const response = await http<ApiResponse<Brand[]>>("/brands", {
      skipAuth: true,
      next: { revalidate: 3600 },
    });
    return response.data || [];
  },

  /**
   * Get single brand by ID
   */
  async getBrand(id: string): Promise<Brand | null> {
    try {
      const response = await http<ApiResponse<Brand>>(`/brands/${id}`, {
        skipAuth: true,
        next: { revalidate: 3600 },
      });
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get SKU details
   */
  async getSku(id: string): Promise<Sku | null> {
    try {
      const response = await http<ApiResponse<Sku>>(`/skus/${id}`, {
        skipAuth: true,
        next: { revalidate: 60 },
      });
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    try {
      const response = await http<ApiResponse<Product[]>>(
        `/products/${productId}/related`,
        {
          params: { limit },
          skipAuth: true,
          next: { revalidate: 300 },
        }
      );
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get all brand IDs for static generation
   */
  async getBrandIds(): Promise<string[]> {
    try {
      const brands = await this.getBrands();
      return brands.map((brand) => brand.id);
    } catch {
      return [];
    }
  },

  /**
   * Get all category IDs for static generation
   */
  async getCategoryIds(): Promise<string[]> {
    try {
      const categories = await this.getCategories();
      return categories.map((category) => category.id);
    } catch {
      return [];
    }
  },

  /**
   * Get all product IDs for static generation
   */
  async getProductIds(limit = 100): Promise<string[]> {
    try {
      const response = await this.getProducts({ limit });
      return response.data.map((product) => product.id);
    } catch {
      return [];
    }
  },
};
