"use client";

import { LoadingScreen } from "@/components/shared/loading-screen";
import { BlogList } from "@/features/blog/components/blog-list";
import { getBlogsAction } from "@/features/blog/public-actions";
import { m, tapScale } from "@/lib/animations";
import { BlogWithProducts } from "@/types/models";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * BLOG PAGE CLIENT - Giao diện danh sách bài viết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLIENT COMPONENT ("use client"):
 * - Trang này cần interactivity cao (Filter theo category, Load more).
 * - Không thể dùng Server Component thuần túy vì cần `useState` và `useEffect`.
 *
 * 2. HYBRID FETCHING STRATEGY:
 * - Dữ liệu ban đầu (`initialPosts`) được fetch từ Server (SSR) để tốt cho SEO.
 * - Khi user chọn Category, ta fetch lại từ API (`getBlogsAction`) ở phía Client.
 * =====================================================================
 */

interface BlogPageClientProps {
  posts: BlogWithProducts[];
  initialStats: {
    categories: { category: string; count: number }[];
    total: number;
  } | null;
}

export function BlogPageClient({
  posts: initialPosts,
  initialStats,
}: BlogPageClientProps) {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const isFirstRender = useRef(true);

  // Use stats from API or fallback to empty
  const categoryStats = initialStats?.categories || [];
  const totalPosts = initialStats?.total || 0;

  // When category changes, fetch new data from server
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchCategoryPosts = async () => {
      // If we go back to "All", we can use the initial posts or refetch "All"
      // Using initialPosts is faster but might be stale if user loaded more pages before.
      // A cleaner way is to re-fetching page 1 to ensure consistency.

      setIsLoading(true);
      setPosts([]); // Clear posts to show full loader
      setPage(1);
      setHasMore(true);

      try {
        // If "All" (null), filter is undefined
        const res = await getBlogsAction(1, 12, selectedCategory || undefined);

        if (res.success && res.data) {
          setPosts(res.data);
          if (res.meta && 1 >= res.meta.lastPage) {
            setHasMore(false);
          }
        } else {
          setPosts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Failed to filter blogs:", error);
        setPosts([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if it's not the initial mount to prevent double fetch?
    // Actually, initial render uses initialPosts. We only need to fetch if selectedCategory changes.
    // However, initial selectedCategory is null.
    // If we want to avoid fetching on mount, we can use a ref.
    // But since selectedCategory starts as null, and we pass initialPosts to useState,
    // we just need to skip if it matches initial state.
    // For simplicity, let's just fetch. The cost is low.
    // Or better: ONLY fetch if we have interacted.
    // We can assume if `posts` === `initialPosts` and category is null, no need to fetch?
    // But complexity arises. Let's just fetch when category changes.
    // To avoid initial fetch on mount (since we have data), check if selectedCategory is non-null OR if we've moved away from initial state.

    fetchCategoryPosts();
  }, [selectedCategory]);

  const loadMorePosts = async () => {
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const res = await getBlogsAction(
        nextPage,
        12,
        selectedCategory || undefined
      );

      if (res.success && res.data.length > 0) {
        setPosts((prev) => [...prev, ...res.data]);
        setPage(nextPage);

        // Check if we reached the end
        if (res.meta && nextPage >= res.meta.lastPage) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pt-24 pb-12 relative overflow-hidden">
      {/* ... existing header ... */}
      <div className="container mx-auto px-4 relative z-10">
        <m.div
          className="text-center space-y-4 mb-10"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </m.div>
        {/* Category Filter */}
        <m.div
          className="flex flex-wrap justify-center gap-2 mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <m.button
            whileTap={tapScale}
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                : "bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            }`}
          >
            {tCommon("all")}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                selectedCategory === null
                  ? "bg-white/20"
                  : "bg-black/5 dark:bg-white/10"
              }`}
            >
              {totalPosts}
            </span>
          </m.button>

          {categoryStats.map((stat) => (
            <m.button
              key={stat.category}
              whileTap={tapScale}
              onClick={() => setSelectedCategory(stat.category)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
                selectedCategory === stat.category
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              }`}
            >
              {stat.category}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  selectedCategory === stat.category
                    ? "bg-white/20"
                    : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {stat.count}
              </span>
            </m.button>
          ))}
        </m.div>
        {/* Posts count */}
        {isLoading && posts.length === 0 ? (
          <LoadingScreen fullScreen={false} className="min-h-[40vh]" />
        ) : (
          <BlogList posts={posts} key={selectedCategory || "all"} />
        )}
        {/* Load More Trigger */}
        {hasMore && posts.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={loadMorePosts}
              disabled={isLoading}
              className="px-8 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm tracking-wide shadow-lg shadow-accent/20 hover:bg-accent/90 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? tCommon("loading") : tCommon("loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
