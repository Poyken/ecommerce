import { blogPosts } from "@/data/blog-posts";
import { MetadataRoute } from "next";

/**
 * =====================================================================
 * SITEMAP.TS - Sơ đồ trang web (Static)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NEXT.JS METADATA ROUTE:
 * - File này (app/sitemap.ts) là quy ước đặc biệt của Next.js App Router.
 * - Nó sẽ tự động generate file `public/sitemap.xml` khi build.
 *
 * 2. PRIORITY & FREQUENCY:
 * - `priority`: Độ quan trọng (0.0 - 1.0). Trang chủ (1.0) quan trọng nhất.
 * - `changeFrequency`: Gợi ý Google bot bao lâu nên quay lại crawl 1 lần.
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

  // Blog Routes (Safe because it's local data)
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...routes, ...blogRoutes];
}
