/**
 * Blog Service - Server-side data fetching for blog posts
 */
import { http } from "@/lib/http";
import { ApiResponse, PaginationMeta } from "@/types/dtos";
import { BlogWithProducts } from "@/types/models";

interface BlogsResponse {
  data: BlogWithProducts[];
  meta: PaginationMeta;
}

interface BlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  language?: string;
  status?: "published" | "draft";
}

export const blogService = {
  /**
   * Get paginated blog posts
   */
  async getBlogs(filters: BlogFilters = {}): Promise<BlogsResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search,
      category: filters.category,
      language: filters.language,
      status: filters.status,
    };

    const response = await http<ApiResponse<BlogWithProducts[]>>("/blogs", {
      params,
      skipAuth: true,
      next: { revalidate: 60 },
    });

    return {
      data: response.data || [],
      meta: response.meta || { page: 1, limit: 10, total: 0, lastPage: 1 },
    };
  },

  /**
   * Get published blog posts for public viewing
   */
  async getPublishedBlogs(limit = 10, page = 1): Promise<BlogsResponse> {
    return this.getBlogs({ page, limit, status: "published" });
  },

  /**
   * Get a single blog post by ID or slug
   */
  async getBlog(idOrSlug: string): Promise<BlogWithProducts | null> {
    try {
      const response = await http<ApiResponse<BlogWithProducts>>(
        `/blogs/${idOrSlug}`,
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
   * Get featured/latest blog posts
   */
  async getLatestBlogs(limit = 5): Promise<BlogWithProducts[]> {
    const response = await this.getBlogs({ limit, status: "published" });
    return response.data;
  },

  /**
   * Get blog categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await http<ApiResponse<string[]>>("/blogs/categories", {
        skipAuth: true,
        next: { revalidate: 3600 },
      });
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get all blog IDs for static generation
   */
  async getBlogIds(): Promise<string[]> {
    try {
      const response = await this.getBlogs({ limit: 100, status: "published" });
      return response.data.map((blog) => blog.id);
    } catch {
      return [];
    }
  },

  /**
   * Alias for getBlog - Get blog post by slug or ID
   */
  async getBlogBySlug(slugOrId: string): Promise<BlogWithProducts | null> {
    return this.getBlog(slugOrId);
  },

  /**
   * Get category statistics - count of blogs per category
   */
  async getCategoryStats(): Promise<{
    categories: { category: string; count: number }[];
    total: number;
  } | null> {
    try {
      const response = await http<
        ApiResponse<{
          categories: { category: string; count: number }[];
          total: number;
        }>
      >("/blogs/category-stats", {
        skipAuth: true,
        next: { revalidate: 3600 },
      });
      return response.data || null;
    } catch {
      // Fallback: compute stats from categories
      try {
        const categories = await this.getCategories();
        const categoryStats = categories.map((cat) => ({
          category: cat,
          count: 0,
        }));
        return { categories: categoryStats, total: 0 };
      } catch {
        return null;
      }
    }
  },
};
