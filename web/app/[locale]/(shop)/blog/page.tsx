import { blogService } from "@/services/blog.service";
import { Blog } from "@/types/models";
import { Metadata } from "next";
import { BlogPageClient } from "./blog-page-client";

/**
 * =====================================================================
 * BLOG PAGE - Trang danh sách bài viết (Journal)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. API DATA FETCHING:
 * - Dữ liệu blog đang được lấy từ backend API thông qua `blogService`.
 * - Cache strategy: revalidate 900s (15 phút) để cân bằng giữa performance và fresh data.
 *
 * 2. CLIENT-SIDE INTERACTION:
 * - `BlogPageClient` xử lý việc hiển thị danh sách bài viết với các hiệu ứng animation.
 *
 * 3. SEO:
 * - Metadata được cấu hình để tối ưu hóa việc hiển thị trên các công cụ tìm kiếm.
 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Journal | Luxe",
  description: "Stories, style guides, and news from the world of fashion.",
};

export default async function BlogPage() {
  let posts: Blog[] = [];
  try {
    const result = await blogService.getBlogs({ limit: 100 });
    posts = result.data;
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
  }

  return <BlogPageClient posts={posts} />;
}
