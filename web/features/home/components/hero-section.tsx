/**
 * =====================================================================
 * HERO SECTION COMPONENT - Banner chính trang chủ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KIẾN TRÚC UI:
 * - Đây là component quan trọng nhất trang Home ("First fold").
 * - Sử dụng `framer-motion` (`m.div`, `AnimatePresence`) để tạo hiệu ứng xuất hiện mượt mà.
 *
 * 2. PERFORMANCE TIPS:
 * - Dùng `m` từ `@/lib/animations` thay vì `motion` để giảm bundle size (Lazy Load).
 * - `Image` component của Next.js có `priority={true}` vì đây là ảnh LCP (Largest Contentful Paint).
 * - Dùng `sizes` prop để browser tải đúng kích thước ảnh theo thiết bị (Mobile/Desktop).
 *
 * 3. CUSTOMIZATION:
 * - Props linh hoạt (`HeroSectionProps`) cho phép tái sử dụng ở các trang khác hoặc A/B Testing. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

/**
 * =================================================================================================
 * HERO SECTION
 * =================================================================================================
 */
interface HeroSectionProps {
  // Content
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  badge?: string;

  // Visual
  bgImage?: string;

  // Featured Card
  featuredTitle?: string;
  featuredPrice?: string;
  showFeaturedCard?: boolean;

  // Layout
  alignment?: "left" | "center";
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  badge,
  bgImage = "/images/home/hero-luxury.jpg",
  featuredTitle,
  featuredPrice,
  showFeaturedCard = true,
  alignment = "left",
}: HeroSectionProps) {
  const t = useTranslations("hero");
  const [isImageReady, setIsImageReady] = useState(false);

  // Defaults
  const displayTitle = title || t("redefining");
  const displaySubtitle = subtitle || t("description");
  const displayCtaText = ctaText || t("shopCollection");
  const displayCtaLink = ctaLink || "/shop";
  const displayFeaturedTitle = featuredTitle || t("silkEveningDress");
  const displayFeaturedPrice = featuredPrice || "$1,299";
  const displayBadge = badge || t("newCollection");

  return (
    <section className="relative w-full min-h-screen flex items-center bg-background overflow-hidden pt-20  ">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[40vh] h-[40vh] bg-secondary/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      </div>

      <div
        className={cn(
          "container relative z-10 grid grid-cols-1 gap-12 lg:gap-20 items-center md:px-12 max-w-8xl mx-auto",
          alignment === "center" ? "text-center" : "lg:grid-cols-2"
        )}
      >
        {/* Text Content */}
        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "space-y-8 lg:space-y-10 order-2 lg:order-1",
            alignment === "center" && "mx-auto max-w-4xl"
          )}
        >
          {displayBadge && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-md border border-border/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">
                {displayBadge}
              </span>
            </m.div>
          )}

          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-normal tracking-[-0.03em] leading-[0.9]">
              <span className="block text-foreground">{displayTitle}</span>
              <span className="relative inline-block mt-2 w-full">
                <span className="text-gradient-champagne italic w-full block pb-4">
                  {t("luxuryStyle")}
                </span>
              </span>
            </h1>

            <p
              className={cn(
                "text-lg text-muted-foreground leading-relaxed font-light max-w-xl",
                alignment === "center" && "mx-auto"
              )}
            >
              {displaySubtitle}
            </p>
          </div>

          <div
            className={cn(
              "flex flex-col sm:flex-row gap-4 pt-4",
              alignment === "center" ? "justify-center" : "justify-start"
            )}
          >
            <TypedLink href={(displayCtaLink || "#") as AppRoute}>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group h-14 px-10 rounded-full bg-primary text-primary-foreground font-bold text-sm tracking-mid uppercase transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  {displayCtaText}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </m.button>
            </TypedLink>

            <TypedLink href={(secondaryCtaLink || "/about") as AppRoute}>
              <GlassButton
                variant="outline"
                size="lg"
                className="h-14 px-10 rounded-full border border-border text-foreground hover:bg-secondary font-bold text-sm tracking-mid uppercase"
              >
                {secondaryCtaText || t("ourStory")}
              </GlassButton>
            </TypedLink>
          </div>

          {/* Bottom Features */}
          <m.div
            className={cn(
              "flex flex-wrap items-center gap-x-12 gap-y-4 pt-10 border-t border-border/30",
              alignment === "center" ? "justify-center" : "justify-start"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { label: t("freeShipping"), value: "Free Shipping" },
              { label: t("premiumQuality"), value: "Premium Quality" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold">
                  {item.label}
                </span>
              </div>
            ))}
          </m.div>
        </m.div>

        {/* Visual Content (Right Side) */}
        {alignment === "left" && (
          <m.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              duration: 1.2,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative h-[60vh] lg:h-[85vh] min-h-[500px] w-full order-1 lg:order-2 group"
          >
            <div className="relative z-10 w-full h-full rounded-4xl lg:rounded-[3rem] overflow-hidden shadow-2xl shadow-accent/10 border border-border/10">
              <AnimatePresence mode="wait">
                {!isImageReady && (
                  <m.div
                    key="skeleton"
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20"
                  >
                    <Skeleton className="w-full h-full rounded-none" />
                  </m.div>
                )}
              </AnimatePresence>

              <Image
                src={bgImage}
                alt="Hero Focus"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                priority
                onLoad={() => setIsImageReady(true)}
              />

              {/* No dark overlay here intentionally for 'light' look */}

              {showFeaturedCard && (
                <m.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 1.2,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10"
                >
                  <div className="glass-luxury p-6 md:p-8 rounded-3xl flex items-center justify-between border border-white/10 backdrop-blur-2xl">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-accent font-bold uppercase tracking-[0.3em]">
                        {t("featuredLook")}
                      </p>
                      <p className="text-xl md:text-2xl font-serif text-foreground leading-tight">
                        {displayFeaturedTitle}
                      </p>
                    </div>
                    <div className="text-right pl-4">
                      <span className="text-2xl md:text-3xl font-light text-foreground tracking-tight">
                        {displayFeaturedPrice}
                      </span>
                    </div>
                  </div>
                </m.div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 -top-8 -right-8 w-40 h-40 border border-accent/20 rounded-full blur-sm" />
            <div className="absolute -z-10 -bottom-8 -left-8 w-32 h-32 border border-accent/10 rounded-full blur-[1px]" />
          </m.div>
        )}
      </div>

      {/* Scroll indicator */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 font-bold">
          Scroll
        </span>
        <m.div
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-linear-to-b from-accent/50 to-transparent"
        />
      </m.div>
    </section>
  );
}
