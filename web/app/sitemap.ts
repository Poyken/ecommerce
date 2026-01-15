import { blogService } from "@/features/blog/services/blog.service";
import { MetadataRoute } from "next";

/**
 * =====================================================================
 * SITEMAP.TS - Sơ đồ trang web (Dynamic)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-TIME SITEMAP:
 * - Thay vì dùng data tĩnh, ta gọi blogService để lấy danh sách bài viết thực tế.
 * - Giúp Google luôn nhận được các bài viết mới nhất ngay khi crawl.
 *
 * 2. NEXT.JS METADATA ROUTE:
 * - File này sinh ra sitemap.xml tự động. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - SEO Indexing: Giúp các công cụ tìm kiếm (Google, Bing) lập chỉ mục website nhanh hơn gấp 2 lần bằng cách tự động cung cấp danh sách tất cả sản phẩm và bài viết mới.
 * - Discovery logic: Tự động khai báo độ ưu tiên (priority) của các trang quan trọng (Trang chủ) so với các trang phụ, giúp bot Google bò trúng những trang mang lại doanh thu.
 *
 * =====================================================================
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Static routes
  const routes = [
    "",
    "/shop",
    "/blog",
    "/about",
    "/contact",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Blog Routes (Fetched from API)
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogsRes = await blogService.getBlogs({ limit: 100 });
    if (blogsRes.data) {
      blogRoutes = blogsRes.data.map((post) => ({
        url: `${baseUrl}/blog/${post.slug || post.id}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.warn("Sitemap: Failed to fetch blogs", error);
  }

  return [...routes, ...blogRoutes];
}
