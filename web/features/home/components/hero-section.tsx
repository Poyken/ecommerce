"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

/**
 * =================================================================================================
 * HERO SECTION - PHẦN MỞ ĐẦU HOÀNH TRÁNG CỦA TRANG CHỦ
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 *    - Đây là "bộ mặt" của Website. Nó cần gây ấn tượng ngay lập tức (First Impression).
 *    - Sử dụng ảnh chất lượng cao, font chữ to (Typography), và hiệu ứng chuyển động.
 *
 * 2. HIỆU ỨNG (ANIMATION):
 *    - Chúng ta dùng thư viện `framer-motion` (được import là `m` từ `@/lib/animations`).
 *    - `initial={{ opacity: 0 }}`: Trạng thái ban đầu (ẩn).
 *    - `animate={{ opacity: 1 }}`: Trạng thái đích (hiện).
 *    - `transition={{ delay: 0.5 }}`: Chờ 0.5s mới bắt đầu chạy -> Tạo hiệu ứng xuất hiện lần lượt (Stagger).
 *
 * 3. TỐI ƯU (OPTIMIZATION):
 *    - Component `Image` của Next.js được dùng với `priority` -> Báo cho trình duyệt tải ảnh này NGAY LẬP TỨC vì nó ở trên cùng (LCP - Largest Contentful Paint).
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

  // Layout & Design
  layout?: "split" | "center" | "fullscreen" | "minimal";
  alignment?: "left" | "center" | "right";
  height?: "auto" | "screen" | "large" | "medium";
  contentWidth?: "narrow" | "medium" | "wide" | "full";

  // Visual
  bgImage?: string;
  bgVideo?: string;
  bgColor?: string;
  overlayType?: "none" | "dark" | "light" | "gradient" | "radial";
  overlayOpacity?: number;
  overlayGradientFrom?: string;
  overlayGradientTo?: string;

  // Featured Card (for split layout)
  featuredTitle?: string;
  featuredPrice?: string;
  featuredImage?: string;
  showFeaturedCard?: boolean;

  // Typography
  titleSize?: "medium" | "large" | "xlarge" | "xxlarge";
  titleFont?: "serif" | "sans" | "display";
  subtitleSize?: "small" | "medium" | "large";

  // Animation
  animationType?: "none" | "fade" | "slide" | "zoom" | "parallax";
  animationDelay?: number;

  // CTA Styling
  ctaStyle?: "solid" | "outline" | "ghost" | "gradient";
  ctaColor?: string;
  ctaRounded?: "none" | "sm" | "md" | "lg" | "full";

  // Bottom Features Bar
  showBottomFeatures?: boolean;
  bottomFeatures?: { label: string; value?: string }[];

  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
  };
}

export function HeroSection({
  // Content
  title,
  subtitle,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  badge,

  // Layout
  layout = "split",
  alignment = "left",
  height = "screen",
  contentWidth = "medium",

  // Visual
  bgImage = "/images/home/hero-luxury.jpg",
  bgVideo,
  bgColor = "bg-background",
  overlayType = "dark",
  overlayOpacity = 0.4,
  overlayGradientFrom = "#000000",
  overlayGradientTo = "transparent",

  // Featured
  featuredTitle,
  featuredPrice,
  featuredImage,
  showFeaturedCard = true,

  // Typography
  titleSize = "xlarge",
  titleFont = "serif",
  subtitleSize = "medium",

  // Animation
  animationType = "fade",
  animationDelay = 0,

  // CTA
  ctaStyle = "solid",
  ctaColor,
  ctaRounded = "full",

  // Bottom Features
  showBottomFeatures = true,
  bottomFeatures,

  styles,
}: HeroSectionProps) {
  const t = useTranslations("hero");
  const [isImageReady, setIsImageReady] = useState(false);

  // Use props if provided, otherwise fallback to translations/defaults
  const displayTitle = title || t("redefining");
  const displaySubtitle = subtitle || t("description");
  const displayCtaText = ctaText || t("shopCollection");
  const displayCtaLink = ctaLink || "/shop";
  const displayFeaturedTitle = featuredTitle || t("silkEveningDress");
  const displayFeaturedPrice = featuredPrice || "$1,299";
  const displayFeaturedImage = featuredImage || bgImage;
  const displayBadge = badge || t("newCollection");
  const displaySecondaryCtaText = secondaryCtaText || t("ourStory");
  const displaySecondaryCtaLink = secondaryCtaLink || "/about";
  const displayBottomFeatures = bottomFeatures || [
    { label: t("freeShipping"), value: "Free Shipping" },
    { label: t("premiumQuality"), value: "Premium Quality" },
  ];

  // Dynamic classes
  const heightClasses = {
    auto: "min-h-[60vh]",
    screen: "min-h-screen",
    large: "min-h-[80vh]",
    medium: "min-h-[50vh]",
  };

  const titleSizeClasses = {
    medium: "text-3xl md:text-5xl lg:text-5xl",
    large: "text-4xl md:text-6xl lg:text-7xl",
    xlarge: "text-5xl md:text-7xl lg:text-8xl xl:text-9xl",
    xxlarge: "text-6xl md:text-8xl lg:text-9xl xl:text-[10rem]",
  };

  const titleFontClasses = {
    serif: "font-serif",
    sans: "font-sans",
    display: "font-display",
  };

  const subtitleSizeClasses = {
    small: "text-sm md:text-base opacity-80",
    medium: "text-base md:text-xl font-light",
    large: "text-lg md:text-2xl font-light",
  };

  const contentWidthClasses = {
    narrow: "max-w-xl",
    medium: "max-w-3xl",
    wide: "max-w-5xl",
    full: "max-w-none",
  };

  const ctaRoundedClasses = {
    none: "rounded-none",
    sm: "rounded-md",
    md: "rounded-xl",
    lg: "rounded-2xl",
    full: "rounded-full",
  };

  const isLayoutSplit = layout === "split";
  const isLayoutMinimal = layout === "minimal";
  const isLayoutCenter = layout === "center" || layout === "fullscreen";

  // Animation variants
  const getInitialAnim = () => {
    switch (animationType) {
      case "fade":
        return { opacity: 0 };
      case "slide":
        return { opacity: 0, y: 40 };
      case "zoom":
        return { opacity: 0, scale: 0.9 };
      case "parallax":
        return { opacity: 0, y: 100 };
      default:
        return { opacity: 1 };
    }
  };

  return (
    <section
      className={cn(
        "relative flex items-center justify-center overflow-hidden transition-colors duration-500",
        heightClasses[height],
        bgColor,
        layout === "fullscreen" && "pt-0",
        layout !== "fullscreen" && "pt-20 md:pt-28"
      )}
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
        paddingTop: styles?.paddingTop,
        paddingBottom: styles?.paddingBottom,
      }}
    >
      {/* Video Background */}
      {bgVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      {overlayType !== "none" && (
        <div
          className="absolute inset-0 z-1 transition-opacity duration-700"
          style={{
            background:
              overlayType === "gradient"
                ? `linear-gradient(to bottom, ${overlayGradientFrom}, ${overlayGradientTo})`
                : overlayType === "radial"
                ? `radial-gradient(ellipse at center, transparent, ${overlayGradientFrom})`
                : overlayType === "dark"
                ? `rgba(0,0,0,${overlayOpacity})`
                : `rgba(255,255,255,${overlayOpacity})`,
          }}
        />
      )}

      {/* Cinematic Background Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-accent/5 rounded-full blur-[150px] opacity-40" />
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-linear-to-t from-background via-background/20 to-transparent" />
      </div>

      <div
        className={cn(
          "container relative z-10 mx-auto px-6 md:px-12",
          isLayoutCenter
            ? "flex flex-col items-center text-center"
            : "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center",
          alignment === "right" && !isLayoutCenter && "lg:flex-row-reverse"
        )}
      >
        {/* Text Content */}
        <m.div
          initial={getInitialAnim()}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            delay: animationDelay,
          }}
          className={cn(
            "space-y-8 lg:space-y-12",
            isLayoutCenter
              ? cn("mx-auto", contentWidthClasses[contentWidth])
              : alignment === "center"
              ? "mx-auto text-center"
              : "text-left",
            isLayoutMinimal && "lg:max-w-4xl"
          )}
        >
          {displayBadge && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + animationDelay, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 backdrop-blur-md border border-border/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">
                {displayBadge}
              </span>
            </m.div>
          )}

          <div className="space-y-6">
            <h1
              className={cn(
                titleSizeClasses[titleSize],
                titleFontClasses[titleFont],
                "font-normal tracking-tight leading-[0.95] text-foreground"
              )}
            >
              {displayTitle.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </div>

          {displaySubtitle && (
            <p
              className={cn(
                subtitleSizeClasses[subtitleSize],
                "text-muted-foreground leading-relaxed max-w-xl",
                (isLayoutCenter || alignment === "center") && "mx-auto"
              )}
            >
              {displaySubtitle}
            </p>
          )}

          <div
            className={cn(
              "flex flex-col sm:flex-row gap-5 pt-4",
              isLayoutCenter || alignment === "center"
                ? "justify-center"
                : "justify-start"
            )}
          >
            {displayCtaText && (
              <Link href={displayCtaLink as any}>
                <m.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group h-14 px-10 font-bold text-sm tracking-widest uppercase transition-all duration-300 transform-gpu",
                    ctaRoundedClasses[ctaRounded],
                    ctaStyle === "solid" &&
                      "bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30",
                    ctaStyle === "outline" &&
                      "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                    ctaStyle === "ghost" &&
                      "bg-secondary/50 backdrop-blur-md border border-border/50 hover:bg-secondary text-foreground",
                    ctaStyle === "gradient" &&
                      "bg-linear-to-r from-accent to-accent-foreground text-white border-none shadow-xl"
                  )}
                  style={ctaColor ? { backgroundColor: ctaColor } : {}}
                >
                  <span className="flex items-center gap-3">
                    {displayCtaText}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                  </span>
                </m.button>
              </Link>
            )}

            {secondaryCtaText && (
              <Link href={displaySecondaryCtaLink as any}>
                <GlassButton
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-14 px-10 border border-border text-foreground font-bold text-sm tracking-widest uppercase transition-all duration-300",
                    ctaRoundedClasses[ctaRounded]
                  )}
                >
                  {displaySecondaryCtaText}
                </GlassButton>
              </Link>
            )}
          </div>

          {showBottomFeatures && (
            <m.div
              className={cn(
                "flex flex-wrap items-center gap-x-10 gap-y-4 pt-10 border-t border-border/30",
                isLayoutCenter || alignment === "center"
                  ? "justify-center"
                  : "justify-start"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 + animationDelay }}
            >
              {displayBottomFeatures.map((item, idx) => (
                <div key={idx} className="flex flex-col items-start gap-1">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold">
                    {item.label}
                  </span>
                  {item.label !== item.value && item.value && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </m.div>
          )}
        </m.div>

        {/* Visual Content (Split Layout) */}
        {isLayoutSplit && showFeaturedCard && (
          <m.div
            initial={{
              opacity: 0,
              x: alignment === "right" ? -50 : 50,
              scale: 0.95,
            }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              duration: 1.2,
              delay: 0.2 + animationDelay,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "relative z-10 h-[65vh] lg:h-[85vh] min-h-[500px] w-full group",
              alignment === "right" ? "order-1" : "order-1 lg:order-2"
            )}
          >
            <div className="relative z-10 w-full rounded-4xl lg:rounded-[3rem] overflow-hidden shadow-2xl shadow-accent/10 border border-border/10">
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

              <div
                className="absolute inset-0 bg-black transition-opacity duration-500"
                style={{ opacity: overlayOpacity * 0.5 }}
              />

              {/* Floating Featured Card */}
              <m.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 1.2 + animationDelay,
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
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 -top-8 -right-8 w-40 h-40 border border-accent/20 rounded-full blur-sm" />
            <div className="absolute -z-10 -bottom-8 -left-8 w-32 h-32 border border-accent/10 rounded-full blur-[1px]" />
          </m.div>
        )}
      </div>

      {height === "screen" && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 font-bold">
            Explore
          </span>
          <m.div
            animate={{ y: [0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-linear-to-b from-accent/50 to-transparent"
          />
        </m.div>
      )}
    </section>
  );
}
