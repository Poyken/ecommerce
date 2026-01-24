import { BlogPostContent } from "@/features/blog/components/blog-post-content";
import { blogService } from "@/features/blog/services/blog.service";
import { Metadata } from "next";
import { notFound } from "next/navigation";



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
      return { title: "Post Not Found" };
    }

    return {
      title: `${post.title} | Journal`,
      description: post.excerpt,
    };
  } catch {
    return {
      title: "Post Not Found",
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
