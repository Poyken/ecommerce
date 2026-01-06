"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { BlogWithProducts } from "@/types/models";
import { format } from "date-fns";
import { m } from "@/lib/animations";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * =====================================================================
 * BLOG LIST - Danh sách bài viết Blog
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FEATURED POST:
 * - Bài viết đầu tiên (`posts[0]`) được hiển thị to hơn (Featured) để thu hút sự chú ý.
 * - Sử dụng `aspect-[21/9]` để tạo layout rộng rãi, chuẩn cinematic.
 *
 * 2. STAGGERED GRID:
 * - Các bài viết còn lại được hiển thị trong một Grid 3 cột (trên desktop).
 * - `whileInView`: Hiệu ứng xuất hiện khi người dùng cuộn trang tới vị trí của card.
 *
 * 3. DYNAMIC STYLING:
 * - Màu sắc của Category được thay đổi linh hoạt dựa trên dữ liệu bài viết.
 *
 * 4. LOAD MORE:
 * - Sử dụng client-side pagination đơn giản với `visibleCount`.
 * - Hiển thị nút "Load More" nếu còn bài viết chưa hiển thị.
 * =====================================================================
 */

interface BlogListProps {
  posts: BlogWithProducts[];
}

export function BlogList({ posts }: BlogListProps) {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const firstPost = posts[0];
  const gridPosts = posts.slice(1);

  if (!firstPost) return null;

  return (
    <>
      {/* Featured Post */}
      <m.div
        className="mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <Link
          href={`/blog/${firstPost.slug}`}
          className="group relative aspect-21/9 block rounded-[2.5rem] overflow-hidden border border-foreground/5 shadow-2xl"
        >
          {firstPost.image && (
            <OptimizedImage
              src={firstPost.image}
              alt={firstPost.title}
              fill
              showShimmer={true}
              containerClassName="w-full h-full"
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
              priority
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 md:p-14 max-w-4xl w-full">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] mb-5">
              <span className="text-primary">{firstPost.category}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-white/70 font-bold flex items-center gap-2">
                <Clock size={14} /> {firstPost.readTime}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-5 group-hover:text-accent transition-colors tracking-tighter">
              {firstPost.title}
            </h2>
            <p className="text-lg text-white/80 line-clamp-2 mb-8 font-medium">
              {firstPost.excerpt}
            </p>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="font-bold">{firstPost.author}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="font-medium">
                {format(new Date(firstPost.createdAt), "dd/MM/yyyy")}
              </span>
            </div>
          </div>
        </Link>
      </m.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {gridPosts.map((post, i) => {
          // Cycle through 4 brand colors: Emerald, Blue, Purple, Amber
          const colorIndex = i % 2;
          const colors = [
            {
              badge: "bg-primary/50 border-primary/30",
              iconBg: "bg-primary/10 text-primary",
              arrowHover: "group-hover:bg-primary group-hover:border-primary",
            },
            {
              badge: "bg-amber-500/50 border-amber-500/30",
              iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              arrowHover:
                "group-hover:bg-amber-600 group-hover:border-amber-600",
            },
          ];
          const theme = colors[colorIndex];

          return (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <GlassCard
                variant="hover"
                className="h-full flex flex-col overflow-hidden rounded-4xl border-foreground/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              >
                {post.image && (
                  <div className="relative aspect-3/2 overflow-hidden">
                    <OptimizedImage
                      src={post.image}
                      alt={post.title}
                      fill
                      showShimmer={true}
                      containerClassName="w-full h-full"
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-5 left-5">
                      <span
                        className={`px-4 py-2 rounded-full backdrop-blur-xl text-white text-[10px] font-bold uppercase tracking-[0.2em] border ${theme.badge}`}
                      >
                        {post.category}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-7 flex flex-col grow">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 mb-4 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />{" "}
                      {format(new Date(post.createdAt), "dd/MM/yyyy")}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-foreground/20" />
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mb-4 group-hover:text-primary transition-colors line-clamp-2 tracking-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground/70 text-sm line-clamp-3 mb-6 grow font-medium leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-5 border-t border-foreground/5">
                    <div className="flex items-center gap-2.5 text-sm font-bold">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.iconBg}`}
                      >
                        <User size={13} />
                      </div>
                      {post.author}
                    </div>
                    <div
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 border-foreground/10 text-muted-foreground group-hover:text-white ${theme.arrowHover}`}
                    >
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </>
  );
}
