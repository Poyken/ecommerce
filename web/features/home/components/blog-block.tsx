"use client";

/**
 * =====================================================================
 * BLOG BLOCK - Hiển thị bài viết từ API
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BaseBlockProps } from "../types/block-types";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  author: string;
  authorAvatar?: string;
  publishedAt: string;
  readTime?: string;
  category: string;
}

interface BlogBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  posts?: BlogPost[];
  layout?: "grid" | "list" | "featured";
  columns?: 2 | 3 | 4;
  count?: number;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showReadTime?: boolean;
  showCategory?: boolean;
  categoryFilter?: string;
  ctaText?: string;
  ctaLink?: string;
}

const defaultPosts: BlogPost[] = [
  {
    id: "1",
    title: "10 Mẹo tối ưu SEO cho cửa hàng E-commerce",
    slug: "10-meo-toi-uu-seo",
    excerpt:
      "Học cách tối ưu SEO để tăng traffic organic và cải thiện thứ hạng trên Google...",
    image: "/images/blog/seo-tips.jpg",
    author: "Nguyễn Văn A",
    publishedAt: "2024-01-15",
    readTime: "5 phút",
    category: "Marketing",
  },
  {
    id: "2",
    title: "Xu hướng E-commerce 2024: AI và Personalization",
    slug: "xu-huong-ecommerce-2024",
    excerpt:
      "Khám phá những xu hướng công nghệ đang định hình tương lai của thương mại điện tử...",
    image: "/images/blog/trends-2024.jpg",
    author: "Trần Thị B",
    publishedAt: "2024-01-10",
    readTime: "8 phút",
    category: "Xu hướng",
  },
  {
    id: "3",
    title: "Hướng dẫn tích hợp thanh toán VNPay",
    slug: "huong-dan-tich-hop-vnpay",
    excerpt:
      "Step-by-step hướng dẫn tích hợp cổng thanh toán VNPay cho cửa hàng của bạn...",
    image: "/images/blog/vnpay-guide.jpg",
    author: "Lê Văn C",
    publishedAt: "2024-01-05",
    readTime: "10 phút",
    category: "Hướng dẫn",
  },
];

export function BlogBlock({
  title = "Blog & Tin tức",
  subtitle = "Cập nhật những kiến thức và xu hướng mới nhất về E-commerce",
  posts = defaultPosts,
  layout = "grid",
  columns = 3,
  showExcerpt = true,
  showAuthor = true,
  showReadTime = true,
  showCategory = true,
  ctaText = "Xem tất cả bài viết",
  ctaLink = "/blog",
}: BlogBlockProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Featured Layout
  if (layout === "featured" && posts.length > 0) {
    const [featured, ...rest] = posts;
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
          >
            <div>
              {title && (
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {ctaLink && (
              <Button variant="outline" asChild>
                <Link href={ctaLink}>
                  {ctaText}
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            )}
          </motion.div>

          {/* Featured + List */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Featured Post */}
            <motion.article
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <Link href={`/blog/${featured.slug}`}>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                  {featured.image ? (
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  {showCategory && (
                    <span className="absolute top-4 left-4 px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      {featured.category}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {featured.title}
                </h3>
                {showExcerpt && (
                  <p className="text-muted-foreground mb-4">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {showAuthor && (
                    <span className="flex items-center gap-1">
                      <User className="size-4" />
                      {featured.author}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    {formatDate(featured.publishedAt)}
                  </span>
                  {showReadTime && featured.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {featured.readTime}
                    </span>
                  )}
                </div>
              </Link>
            </motion.article>

            {/* List Posts */}
            <div className="space-y-6">
              {rest.slice(0, 3).map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex gap-4"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex-shrink-0 relative w-32 h-24 rounded-xl overflow-hidden"
                  >
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    {showCategory && (
                      <span className="text-xs font-medium text-primary">
                        {post.category}
                      </span>
                    )}
                    <Link href={`/blog/${post.slug}`}>
                      <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(post.publishedAt)}</span>
                      {showReadTime && post.readTime && (
                        <span>{post.readTime}</span>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Grid/List Layout
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
        >
          <div>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {ctaLink && (
            <Button variant="outline" asChild>
              <Link href={ctaLink}>
                {ctaText}
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          )}
        </motion.div>

        {/* Posts Grid */}
        <div
          className={cn(
            "grid gap-6 lg:gap-8",
            layout === "grid" ? gridCols[columns] : "grid-cols-1"
          )}
        >
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group",
                layout === "list" && "flex gap-6 items-start"
              )}
            >
              <Link
                href={`/blog/${post.slug}`}
                className={cn(
                  "block relative rounded-2xl overflow-hidden",
                  layout === "grid"
                    ? "aspect-[16/10] mb-4"
                    : "w-48 h-32 flex-shrink-0"
                )}
              >
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                {showCategory && layout === "grid" && (
                  <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                    {post.category}
                  </span>
                )}
              </Link>

              <div className={cn(layout === "list" && "flex-1")}>
                {showCategory && layout === "list" && (
                  <span className="text-xs font-medium text-primary">
                    {post.category}
                  </span>
                )}
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                {showExcerpt && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {showAuthor && (
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {post.author}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(post.publishedAt)}
                  </span>
                  {showReadTime && post.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {post.readTime}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
