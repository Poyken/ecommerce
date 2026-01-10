/**
 * =====================================================================
 * BLOG SERVICE - Service Layer cho tin tức và bài viết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA FETCHING (GET):
 * - Service này chuyên dùng để lấy dữ liệu bài viết từ Backend.
 * - Sử dụng `http` utility với option `skipAuth: true` vì blog là nội dung công khai.
 *
 * 2. NEXT.JS CACHING:
 * - Sử dụng `next: { revalidate: 900 }` để cache dữ liệu trong 15 phút.
 * - Giúp tăng tốc độ tải trang và giảm tải cho Backend API.
 *
 * 3. SLUG-BASED RETRIEVAL:
 * - `getBlogBySlug` cho phép lấy chi tiết bài viết dựa trên đường dẫn thân thiện (slug) thay vì ID.
 * =====================================================================
 */
import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { BlogWithProducts } from "@/types/models";

export const blogService = {
  /**
   * =====================================================================
   * BLOG SERVICE (WEB) - Client-side Service
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. NEXT.JS CACHING STRATEGY:
   * - `next: { revalidate: 900 }`: Đây là tính năng ISR (Incremental Static Regeneration).
   * - Dữ liệu blog sẽ được cache trong 15 phút (900s). Giúp trang load cực nhanh vì không phải gọi API liên tục.
   * - Sau 15 phút, nếu có request mới, Next.js sẽ ngầm gọi lại API để lấy bài viết mới.
   *
   * 2. QUERY PARAMS BUILDER:
   * - Sử dụng `URLSearchParams` để xây dựng chuỗi query string an toàn, tự động mã hóa các ký tự đặc biệt.
   * - KHÔNG NÊN cộng chuỗi thủ công (VD: "?page=" + page) vì dễ lỗi và thiếu clear.
   *
   * 3. SKIP AUTH:
   * - Blog là nội dung công khai, nên ta set `skipAuth: true` trong `http` client để không gửi kèm Token (giảm tải header).
   * =====================================================================
   */
  /**
   * Get list of blog posts with optional filters
   */
  /**
   * Get list of blog posts with optional filters
   */
  async getBlogs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    language?: string;
    status?: "published" | "draft";
  }): Promise<ApiResponse<BlogWithProducts[]>> {
    try {
      const response = await http<ApiResponse<BlogWithProducts[]>>("/blogs", {
        params: params as Record<string, string | number | boolean | undefined>,
        skipAuth: true,
        next: { revalidate: 900 }, // Cache for 15 minutes
      });
      return (
        response || {
          data: [],
          meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
        }
      );
    } catch (error) {
      console.error("Lấy danh sách bài viết thất bại:", error);
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
      } as unknown as ApiResponse<BlogWithProducts[]>;
    }
  },

  /**
   * Get published blog posts for public viewing
   */
  async getPublishedBlogs(
    limit = 10,
    page = 1
  ): Promise<ApiResponse<BlogWithProducts[]>> {
    return this.getBlogs({ page, limit, status: "published" });
  },

  /**
   * Get featured/latest blog posts
   */
  async getLatestBlogs(limit = 5): Promise<BlogWithProducts[]> {
    const result = await this.getBlogs({ limit, status: "published" });
    return result.data || [];
  },

  /**
   * Get a single blog post by ID or slug (includes featured products)
   */
  async getBlog(idOrSlug: string): Promise<BlogWithProducts | null> {
    return this.getBlogBySlug(idOrSlug);
  },

  /**
   * Get a single blog post by ID or slug (includes featured products)
   */
  async getBlogBySlug(slug: string): Promise<BlogWithProducts | null> {
    try {
      const response = await http<ApiResponse<BlogWithProducts>>(
        `/blogs/${slug}`,
        {
          skipAuth: true,
          next: { revalidate: 900 },
        }
      );
      return response?.data || null;
    } catch (error) {
      console.error("Lấy chi tiết bài viết thất bại:", error);
      return null;
    }
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
      return response?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get list of blog IDs for static site generation
   */
  async getBlogIds(): Promise<string[]> {
    try {
      const result = await this.getBlogs({ limit: 100 });
      return result?.data?.map((b) => b.id) || [];
    } catch (error) {
      console.error("Lấy danh sách ID bài viết thất bại:", error);
      return [];
    }
  },
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
        next: { revalidate: 900 },
      });
      return response?.data || null;
    } catch (error) {
      console.warn("Lấy thống kê danh mục thất bại:", error);
      // Fallback
      return null;
    }
  },
};
