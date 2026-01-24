import { blogService } from "@/features/blog/services/blog.service";
import { MetadataRoute } from "next";



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
