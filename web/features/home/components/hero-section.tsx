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
    <section className="relative min-h-[95vh] flex items-center bg-transparent overflow-hidden pt-20 selection:bg-accent/30">
      {/* Background is handled by HomeWrapper (fixed) */}

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
            "space-y-8 lg:space-y-12 order-2 lg:order-1",
            alignment === "center" && "mx-auto max-w-4xl"
          )}
        >
          {displayBadge && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Sparkles className="size-3 animate-pulse" />
              <span>{displayBadge}</span>
            </m.div>
          )}

          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tighter leading-[0.85] bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40">
              <span className="block">{displayTitle}</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 px-1">
                {t("luxuryStyle")}
              </span>
            </h1>

            <p
              className={cn(
                "text-xl text-muted-foreground/80 leading-relaxed font-medium max-w-2xl",
                alignment === "center" && "mx-auto"
              )}
            >
              {displaySubtitle}
            </p>
          </div>

          <div
            className={cn(
              "flex flex-col sm:flex-row gap-6 pt-6",
              alignment === "center" ? "justify-center" : "justify-start"
            )}
          >
            <TypedLink href={(displayCtaLink || "#") as AppRoute}>
              <button
                className="group h-18 px-12 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-widest transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10 cursor-pointer flex items-center gap-4"
              >
                {displayCtaText}
                <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </TypedLink>

            <TypedLink href={(secondaryCtaLink || "/about") as AppRoute}>
              <GlassButton
                variant="outline"
                size="lg"
                className="h-18 px-12 rounded-2xl border-white/10 text-foreground hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-all duration-500 hover:scale-[1.03]"
              >
                {secondaryCtaText || t("ourStory")}
              </GlassButton>
            </TypedLink>
          </div>

          {/* Bottom Features */}
          <m.div
            className={cn(
              "flex flex-wrap items-center gap-x-16 gap-y-4 pt-12 border-t border-white/5",
              alignment === "center" ? "justify-center" : "justify-start"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { label: t("freeShipping"), value: "Standard 0 VND" },
              { label: t("premiumQuality"), value: "Grade A++ Luxury" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-black">
                  {item.label}
                </span>
                <span className="text-xs font-medium text-muted-foreground/60">{item.value}</span>
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
            className="relative h-[65vh] lg:h-[90vh] min-h-[550px] w-full order-1 lg:order-2 group"
          >
            <div className="relative z-10 w-full h-full rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.02)] border border-white/5 bg-cinematic/50 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {!isImageReady && (
                  <m.div
                    key="skeleton"
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20"
                  >
                    <Skeleton className="size-full rounded-none bg-white/5" />
                  </m.div>
                )}
              </AnimatePresence>

              <Image
                src={bgImage}
                alt="Hero Focus"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
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
                  className="absolute bottom-8 left-8 right-8"
                >
                  <div className="glass-premium p-8 rounded-4xl flex items-center justify-between border border-white/10 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:scale-[1.02] group/card">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2">
                        <div className="size-2 rounded-full bg-accent animate-pulse" />
                        <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em]">
                          {t("featuredLook")}
                        </p>
                      </div>
                      <p className="text-2xl font-bold tracking-tight text-foreground/90">
                        {displayFeaturedTitle}
                      </p>
                    </div>
                    <div className="text-right pl-6">
                      <span className="text-3xl font-black text-foreground italic tracking-tighter">
                        {displayFeaturedPrice}
                      </span>
                    </div>
                  </div>
                </m.div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 -top-12 -right-12 size-64 border border-white/5 rounded-full blur-[2px] animate-pulse-glow" />
            <div className="absolute -z-10 -bottom-12 -left-12 size-48 border border-white/10 rounded-full blur-[1px] animate-float" />
          </m.div>
        )}
      </div>

      {/* Scroll indicator */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none"
      >
        <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40 font-black">
          Scrolldown
        </span>
        <m.div
          animate={{ y: [0, 15, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-16 bg-linear-to-b from-accent to-transparent"
        />
      </m.div>
    </section>
  );
}
