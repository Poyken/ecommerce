import { BlogPostContent } from "@/features/blog/components/blog-post-content";
import { blogService } from "@/features/blog/services/blog.service";
import { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * =====================================================================
 * BLOG POST PAGE - Trang chi tiết bài viết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. API DATA FETCHING:
 * - Fetch blog post from backend API by slug using `blogService.getBlogBySlug()`.
 * - Supports both ID and slug for flexibility.
 *
 * 2. DYNAMIC METADATA:
 * - `generateMetadata`: Lấy tiêu đề và mô tả của chính bài viết đó để làm SEO.
 *
 * 3. ERROR HANDLING:
 * - `notFound()`: Nếu slug không tồn tại, Next.js sẽ tự động chuyển hướng sang trang 404. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const ids = await blogService.getBlogIds();
    if (ids.length === 0) {
      return [];
    }
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.warn("Failed to generate blog static params:", error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const post = await blogService.getBlogBySlug(id);

    if (!post) {
      return { title: "Post Not Found | Luxe" };
    }

    return {
      title: `${post.title} | Luxe Journal`,
      description: post.excerpt,
    };
  } catch {
    return {
      title: "Post Not Found | Luxe",
    };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const post = await blogService.getBlogBySlug(id);

  if (!post) {
    notFound();
  }

  return <BlogPostContent post={post} />;
}
