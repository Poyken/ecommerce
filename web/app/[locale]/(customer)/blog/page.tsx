import { blogService } from "@/features/blog/services/blog.service";
import { Blog } from "@/types/models";
import { Metadata } from "next";
import { BlogPageClient } from "./blog-page-client";



export const metadata: Metadata = {
  title: "Journal",
  description: "Stories, style guides, and news from the world of fashion.",
};

export default async function BlogPage() {
  let posts: Blog[] = [];
  let stats = null;
  try {
    const [postsResult, statsResult] = await Promise.all([
      blogService.getBlogs({ limit: 12 }),
      blogService.getCategoryStats(),
    ]);
    posts = postsResult.data;
    stats = statsResult;
  } catch {
    // Silently fail - will show empty posts
  }

  return <BlogPageClient posts={posts} initialStats={stats} />;
}
