"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * HERO SECTION - Quiet Luxury Edition (Màn hình chính)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUIET LUXURY DESIGN (Sang trọng thầm lặng):
 * - Không dùng màu quá gắt. Chủ đạo là "Bone White", "Charcoal", "Champagne".
 * - Typography (Font chữ): Dùng Serif (có chân) cho tiêu đề để tạo cảm giác tạp chí thời trang cao cấp (Editorial).
 * - Nhiều khoảng trắng (Whitespace) để tạo cảm giác "thở" và premium.
 *
 * 2. VISUAL HIERARCHY (Phân cấp thị giác):
 * - Tiêu đề to nhất -> Gradient champagne -> Nút bấm -> Ảnh.
 * - Dùng ánh sáng (Lighting) làm nền để hướng mắt người dùng vào trung tâm.
 *
 * 3. MICRO-INTERACTIONS (Tương tác nhỏ):
 * - Nút bấm hơi phồng lên (`scale: 1.02`) khi hover.
 * - Ảnh chính zoom nhẹ (`scale-105`) khi di chuột.
 * - Những chi tiết nhỏ này làm website "sống động" hơn mà không cần animation quá lố.
 * =====================================================================
 */

export function HeroSection() {
  const t = useTranslations("hero");
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/images/home/hero-luxury.jpg";
    img.onload = () => setIsImageReady(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-28">
      {/* Cinematic Background Lighting */}
      <div className="absolute inset-0 z-0">
        {/* Top Champagne Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-accent/10 rounded-full blur-[150px] opacity-60" />

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-linear-to-t from-background via-background/50 to-transparent" />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px),
                              linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center   md:px-12 max-w-8xl mx-auto   lg:py-0">
        {/* Text Content - Editorial & Minimal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 text-center lg:text-left order-2 lg:order-1"
        >
          {/* Subtle Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
              {t("newCollection")}
            </span>
          </motion.div>

          {/* Main Headline - Serif Editorial */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-normal tracking-[-0.03em] leading-[0.9]">
              <span className="block text-foreground">{t("redefining")}</span>
              <span className="relative inline-block mt-2 w-full">
                <span className="text-gradient-champagne italic w-full block pb-4">
                  {t("luxuryStyle")}
                </span>
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed font-light">
            {t("description")}
          </p>

          {/* CTA Buttons - Quiet Luxury Style */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Link href="/shop">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group h-14 px-10 rounded-full bg-primary text-primary-foreground font-medium text-sm tracking-wider uppercase transition-[background-color,box-shadow,opacity] duration-300 hover:shadow-2xl hover:shadow-primary/20 transform-gpu will-change-transform"
              >
                <span className="flex items-center gap-3">
                  {t("shopCollection")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>
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

          {/* Minimal Trust Indicators */}
          <motion.div
            className="flex items-center gap-8 pt-8 border-t border-border/50 justify-center lg:justify-start"
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
          </motion.div>
        </motion.div>

        {/* Visual Content - Statement Image with Glassmorphism Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-[60vh] lg:h-[80vh] min-h-[500px] order-1 lg:order-2 group"
        >
          {/* Main Image Container */}
          <motion.div className="relative h-full w-full rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-accent/10">
            <AnimatePresence mode="wait">
              {!isImageReady && (
                <motion.div
                  key="skeleton"
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20"
                >
                  <Skeleton className="w-full h-full rounded-none" />
                </motion.div>
              )}
            </AnimatePresence>

            <Image
              src="/images/home/hero-luxury.jpg"
              alt="Luxury Collection"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-105"
              priority
              onLoad={() => setIsImageReady(true)}
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60" />

            {/* Floating Product Card - Glassmorphism */}
            <motion.div
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
                    {t("silkEveningDress")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl md:text-2xl font-medium text-foreground">
                    $1,299
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute -z-10 -top-8 -right-8 w-32 h-32 border border-accent/20 rounded-full" />
          <div className="absolute -z-10 -bottom-4 -left-4 w-24 h-24 border border-accent/10 rounded-full" />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-linear-to-b from-accent/50 to-transparent"
        />
      </motion.div>
    </section>
  );
}
