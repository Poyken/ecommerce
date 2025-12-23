"use client";

import { BlogList } from "@/components/organisms/blog-list";
import { BlogWithProducts } from "@/types/models";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

/**
 * =====================================================================
 * BLOG PAGE CLIENT - Giao diện danh sách bài viết với Category Filter
 * =====================================================================
 */

interface BlogPageClientProps {
  posts: BlogWithProducts[];
}

export function BlogPageClient({ posts }: BlogPageClientProps) {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract unique categories from posts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach((post) => {
      if (post.category) cats.add(post.category);
    });
    return Array.from(cats).sort();
  }, [posts]);

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pt-24 pb-12 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
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
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === null
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            {tCommon("all")}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Posts count */}
        {selectedCategory && (
          <motion.p
            className="text-center text-muted-foreground mb-8 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {tCommon("showingPosts", {
              count: filteredPosts.length,
              category: selectedCategory,
            })}
          </motion.p>
        )}

        <BlogList posts={filteredPosts} key={selectedCategory || "all"} />
      </div>
    </div>
  );
}
