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

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  alignment?: "left" | "center";
  bgImage?: string;
  bgColor?: string;
  overlayOpacity?: number;
  featuredTitle?: string;
  featuredPrice?: string;
  featuredImage?: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export function HeroSection({ 
    title, 
    subtitle, 
    ctaText, 
    ctaLink,
    alignment = "left",
    bgImage = "/images/home/hero-luxury.jpg",
    bgColor = "bg-background",
    overlayOpacity = 0.4,
    featuredTitle,
    featuredPrice,
    featuredImage,
    styles
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

  return (
    <section 
        className={cn("relative min-h-screen flex items-center justify-center overflow-hidden pt-28", bgColor)}
        style={{ 
            backgroundColor: styles?.backgroundColor,
            color: styles?.textColor
        }}
    >
      {/* Cinematic Background Lighting */}
      <div className="absolute inset-0 z-0 text-foreground">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-accent/10 rounded-full blur-[150px] opacity-60" />
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-linear-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className={cn(
          "container relative z-10 grid grid-cols-1 gap-12 lg:gap-20 items-center md:px-12 max-w-8xl mx-auto lg:py-0",
          alignment === "center" ? "grid-cols-1 text-center" : "lg:grid-cols-2"
      )}>
        {/* Text Content */}
        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
              "space-y-10 order-2 lg:order-1",
              alignment === "center" ? "max-w-3xl mx-auto" : "text-center lg:text-left"
          )}
        >
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
              {t("newCollection")}
            </span>
          </m.div>

          <div className="space-y-4">
            <h1 className={cn(
                "text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-normal tracking-[-0.03em] leading-[0.9]",
                alignment === "center" ? "px-4" : ""
            )}>
              <span className="block text-foreground">{displayTitle}</span>
              <span className="relative inline-block mt-2 w-full">
                <span className="text-gradient-champagne italic w-full block pb-4">
                  {t("luxuryStyle")}
                </span>
              </span>
            </h1>
          </div>

          <p className={cn(
              "text-lg text-muted-foreground leading-relaxed font-light",
              alignment === "center" ? "mx-auto" : "max-w-md mx-auto lg:mx-0"
          )}>
            {displaySubtitle}
          </p>

          <div className={cn(
              "flex flex-col sm:flex-row gap-4 pt-4",
              alignment === "center" ? "justify-center" : "justify-center lg:justify-start"
          )}>
            <Link href={displayCtaLink as any}>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group h-14 px-10 rounded-full bg-primary text-primary-foreground font-medium text-sm tracking-wider uppercase transition-[background-color,box-shadow,opacity] duration-300 hover:shadow-2xl hover:shadow-primary/20 transform-gpu will-change-transform"
              >
                <span className="flex items-center gap-3">
                  {displayCtaText}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </m.button>
            </Link>
            <Link href="/about">
              <GlassButton
                variant="outline"
                size="lg"
                className="h-14 px-10 rounded-full border border-border text-foreground hover:bg-secondary hover:border-accent/30 font-medium text-sm tracking-wider uppercase"
              >
                {t("ourStory")}
              </GlassButton>
            </Link>
          </div>

          <m.div
            className={cn(
                "flex items-center gap-8 pt-8 border-t border-border/50",
                alignment === "center" ? "justify-center" : "justify-center lg:justify-start"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { label: t("freeShipping"), value: "Free Shipping" },
              { label: t("premiumQuality"), value: "Premium Quality" },
            ].map((item, idx) => (
              <div key={idx} className="text-center lg:text-left">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </m.div>
        </m.div>

        {/* Visual Content - Hidden or Centered depending on alignment */}
        {alignment === "left" && (
            <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[60vh] lg:h-[80vh] min-h-[500px] order-1 lg:order-2 group"
            >
            <m.div className="relative h-full w-full rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-accent/10">
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
                alt="Luxury Collection"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-105"
                priority
                onLoad={() => setIsImageReady(true)}
                />

                <div 
                    className="absolute inset-0 bg-black" 
                    style={{ opacity: overlayOpacity }}
                />

                <m.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                    delay: 1.2,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute bottom-6 left-6 right-6 md:left-8 md:right-8 md:bottom-8"
                >
                <div className="glass-luxury p-5 md:p-6 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                        {t("featuredLook")}
                    </p>
                    <p className="text-lg md:text-xl font-serif text-foreground">
                        {displayFeaturedTitle}
                    </p>
                    </div>
                    <div className="text-right">
                    <span className="text-xl md:text-2xl font-medium text-foreground">
                        {displayFeaturedPrice}
                    </span>
                    </div>
                </div>
                </m.div>
            </m.div>

            <div className="absolute -z-10 -top-8 -right-8 w-32 h-32 border border-accent/20 rounded-full" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-24 h-24 border border-accent/10 rounded-full" />
            </m.div>
        )}
      </div>

      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">
          Scroll
        </span>
        <m.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-linear-to-b from-accent/50 to-transparent"
        />
      </m.div>
    </section>
  );
}
