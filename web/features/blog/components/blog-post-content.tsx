"use client";

import { BackgroundBlob } from "@/components/shared/background-blob";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { FeaturedProducts } from "@/features/products/components/featured-products";
import { Link } from "@/i18n/routing";
import { fadeInRight, fadeInUp, m, staggerContainer } from "@/lib/animations";
import { BlogWithProducts } from "@/types/models";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import { ArrowLeft, Calendar, Clock, Share2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedError } from "@/components/shared/animated-error";
import Image from "next/image";

import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * BLOG POST CONTENT - Chi tiết bài viết Blog
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AMBIENT BACKGROUND:
 * - Sử dụng các đốm màu `blur` ở background để tạo không gian nghệ thuật, không bị nhàm chán.
 *
 * 2. TYPOGRAPHY (Tailwind Typography):
 * - `prose prose-lg dark:prose-invert`: Sử dụng plugin `@tailwindcss/typography` để tự động style cho nội dung HTML (`dangerouslySetInnerHTML`).
 * - Giúp các thẻ `h1`, `p`, `img` trong bài viết trông đẹp mắt mà không cần viết CSS thủ công.
 *
 * 3. ASIDE (Sidebar):
 * - Chứa các chức năng phụ như Share bài viết và đăng ký Newsletter.
 * - `sticky top-24`: Giúp sidebar luôn hiển thị khi người dùng đọc bài viết dài.
 *
 * 4. FEATURED PRODUCTS:
 * - Hiển thị sản phẩm liên quan được gắn với bài blog.
 * - Giúp tăng conversion và trải nghiệm người dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface BlogPostContentProps {
  post: BlogWithProducts;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [isImageReady, setIsImageReady] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubscribe = () => {
    if (!email) {
      setEmailError(tCommon("emailRequired"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(tCommon("emailInvalid"));
      return;
    }

    // Success scenario
    setEmailError("");
    toast({
      title: tCommon("subscribedTitle"),
      description: tCommon("subscribedDesc"),
      variant: "success",
    });
    setEmail("");
  };

  useEffect(() => {
    if (post.image) {
      const img = new window.Image();
      img.src = post.image;
      if (img.complete) {
        requestAnimationFrame(() => setIsImageReady(true));
      } else {
        img.onload = () => setIsImageReady(true);
      }
    } else {
      requestAnimationFrame(() => setIsImageReady(true));
    }
  }, [post.image]);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30 pt-28 pb-24 relative overflow-hidden">
      {/* Ambient Background - Quiet Luxury */}
      <div className="fixed inset-0 bg-linear-to-br from-accent/3 via-secondary/5 to-accent/3 -z-20" />
      <BackgroundBlob
        variant="primary"
        position="top-left"
        size="xl"
        opacity="low"
      />
      <BackgroundBlob
        variant="warning"
        position="bottom-right"
        size="xl"
        opacity="low"
      />
      <BackgroundBlob
        variant="primary"
        position="center"
        size="lg"
        opacity="low"
        className="blur-[100px]"
      />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <m.div initial="hidden" animate="visible" variants={staggerContainer}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>{tCommon("backToJournal")}</span>
          </Link>

          <div className="space-y-6 mb-12 text-center">
            <div className="flex items-center justify-center gap-2">
              {(() => {
                const colors = [
                  "bg-primary/10 text-primary border-primary/30",
                  "bg-warning/10 text-warning border-warning/30",
                  "bg-primary/10 text-primary border-primary/30",
                  "bg-warning/10 text-warning border-warning/30",
                ];
                const colorClass = colors[(post.category?.length || 0) % 4];
                return (
                  <span
                    className={`px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-medium uppercase tracking-[0.2em] border shadow-sm ${colorClass}`}
                  >
                    {post.category || "Uncategorized"}
                  </span>
                );
              })()}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-foreground leading-tight">
              {post.title || "Untitled Post"}
            </h1>

            <div className="flex items-center justify-center gap-6 text-muted-foreground text-sm md:text-base">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{post.author || "Unknown Author"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-foreground/20" />
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {post.createdAt
                    ? format(new Date(post.createdAt), "dd/MM/yyyy")
                    : "Unknown Date"}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-foreground/20" />
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{post.readTime || "1 min read"}</span>
              </div>
            </div>
          </div>

          {post.image && (
            <div className="relative aspect-21/9 w-full rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl bg-muted/20">
              <AnimatePresence mode="wait">
                {!isImageReady && (
                  <m.div
                    key="skeleton"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-20"
                  >
                    <Skeleton className="w-full h-full" />
                  </m.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isImageReady && (
                  <m.div
                    key="image"
                    initial={{ opacity: 0, filter: "blur(20px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <m.article
            className="lg:col-span-8 prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-2xl max-w-none"
            variants={fadeInUp}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content, {
                ADD_TAGS: ["iframe"],
                ADD_ATTR: [
                  "allow",
                  "allowfullscreen",
                  "frameborder",
                  "scrolling",
                ],
              }),
            }}
          />

          <m.aside className="lg:col-span-4 space-y-8" variants={fadeInRight}>
            <GlassCard className="p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4">
                {tCommon("shareArticle")}
              </h3>
              <div className="flex gap-2">
                <GlassButton
                  size="icon"
                  variant="secondary"
                  className="hover:text-[#1877F2] hover:bg-[#1877F2]/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </GlassButton>
                <GlassButton
                  size="icon"
                  variant="secondary"
                  className="hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </GlassButton>
                <GlassButton
                  size="icon"
                  variant="secondary"
                  className="hover:text-[#0A66C2] hover:bg-[#0A66C2]/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </GlassButton>
                <GlassButton
                  size="icon"
                  variant="secondary"
                  className="hover:text-primary hover:bg-primary/10"
                >
                  <Share2 size={20} />
                </GlassButton>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-lg font-bold mb-4">
                  {tCommon("newsletter")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("newsletterDesc")}
                </p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubscribe();
                      }}
                      placeholder="Enter your email"
                      className={`w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        emailError ? "border-destructive ring-destructive" : ""
                      }`}
                    />
                    <AnimatedError message={emailError} />
                  </div>
                  <GlassButton
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleSubscribe}
                  >
                    {tCommon("subscribe")}
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </m.aside>
        </div>

        {/* Featured Products Section */}
        {post.products && post.products.length > 0 && (
          <FeaturedProducts products={post.products} />
        )}
      </div>
    </div>
  );
}
