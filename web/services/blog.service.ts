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
   * Get list of blog posts with optional filters
   */
  async getBlogs(params?: {
    page?: number;
    limit?: number;
    category?: string;
    language?: string;
  }): Promise<ApiResponse<BlogWithProducts[]>> {
    try {
      const response = await http<ApiResponse<BlogWithProducts[]>>("/blogs", {
        params: params as any,
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
      } as any;
    }
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
};
