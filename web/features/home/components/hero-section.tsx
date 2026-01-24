
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
    <section className="relative min-h-[100vh] flex items-center justify-center bg-black overflow-hidden selection:bg-accent/30">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt="Hero Background"
          fill
          priority
          onLoad={() => setIsImageReady(true)}
          className={cn(
            "object-cover object-center transition-opacity duration-1000",
            isImageReady ? "opacity-60" : "opacity-0"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
        {/* Grain Texture */}
        <div className="absolute inset-0 texture-grain opacity-20" />
      </div>

      <div className="container relative z-10 px-4 md:px-12 max-w-7xl mx-auto text-center">
        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 flex flex-col items-center"
        >
          {displayBadge && (
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass-premium border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Sparkles className="size-3 text-accent animate-pulse" />
              <span>{displayBadge}</span>
            </m.div>
          )}

          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
              <span className="block">{displayTitle}</span>
              <span className="font-serif italic font-light text-white/50 block mt-2 text-4xl md:text-6xl">
                {t("luxuryStyle")}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 leading-relaxed font-medium max-w-2xl mx-auto drop-shadow-lg">
              {displaySubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-8">
            <TypedLink href={(displayCtaLink || "#") as AppRoute}>
              <button className="group h-16 px-10 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer flex items-center gap-4">
                {displayCtaText}
                <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </TypedLink>

            <TypedLink href={(secondaryCtaLink || "/about") as AppRoute}>
              <button className="h-16 px-10 rounded-full glass-premium border border-white/20 text-white hover:bg-white/10 font-black text-xs uppercase tracking-widest transition-all duration-500 hover:scale-[1.05]">
                {secondaryCtaText || t("ourStory")}
              </button>
            </TypedLink>
          </div>
        </m.div>
      </div>

      {/* Featured Floating Card (Bottom Left) */}
      {showFeaturedCard && (
        <m.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-12 hidden lg:block z-20"
        >
          <div className="glass-premium p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-6 max-w-xs hover:scale-105 transition-transform duration-500">
            <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <Sparkles className="size-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-1">
                {t("featuredLook")}
              </p>
              <p className="text-lg font-bold text-white leading-tight">
                {displayFeaturedTitle}
              </p>
              <p className="text-white/50 text-sm mt-1">{displayFeaturedPrice}</p>
            </div>
          </div>
        </m.div>
      )}

      {/* Scroll Indicator */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none z-20"
      >
        <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-black">
          Scrolldown
        </span>
        <m.div
          animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-accent to-transparent"
        />
      </m.div>
    </section>
  );
}

