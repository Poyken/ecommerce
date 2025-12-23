"use client";

import { BackgroundBlob } from "@/components/atoms/background-blob";
import { GlassButton } from "@/components/atoms/glass-button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Shield, Sparkles, Truck } from "lucide-react";
import Image from "next/image";

/**
 * =====================================================================
 * HERO SECTION - Section đầu trang (First Impression)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VISUAL HIERARCHY:
 * - Sử dụng Headline lớn (`text-5xl lg:text-7xl`) với gradient text để thu hút sự chú ý ngay lập tức.
 * - Nút CTA (Call to Action) chính có màu Emerald nổi bật, nút phụ dùng Outline.
 *
 * 2. BACKGROUND AESTHETICS:
 * - Kết hợp nhiều lớp `blur-full` và `animate-pulse` để tạo nền động (Dynamic background).
 * - Tạo cảm giác không gian 3D và chiều sâu cho trang web.
 *
 * 3. FRAMER MOTION:
 * - `initial={{ opacity: 0, x: -50 }}`: Hiệu ứng trượt từ trái sang phải khi load trang.
 * - `type: "spring"`: Sử dụng hiệu ứng lò xo cho ảnh bên phải để tạo cảm giác "nảy" tự nhiên.
 * =====================================================================
 */

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/atoms/skeleton";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function HeroSection() {
  const t = useTranslations("hero");
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src =
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1200&q=90";
    img.onload = () => setIsImageReady(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-24 pb-12">
      {/* Background Elements - Multi-layered Depth */}
      <div className="absolute inset-0 z-0">
        <BackgroundBlob
          variant="warning"
          position="top-right"
          size="xl"
          opacity="low"
          className="blur-[180px]"
        />
        <BackgroundBlob
          variant="primary"
          position="bottom-left"
          size="lg"
          opacity="low"
          className="blur-[150px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 md:px-8 max-w-[95vw] lg:max-w-[90vw] mx-auto">
        {/* Text Content - Elegant & Powerful */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 lg:space-y-10 text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-xl shadow-lg shadow-accent/10 animate-pulse-glow"
          >
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-xs font-bold text-accent uppercase tracking-[0.2em]">
              {t("newCollection")}
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl lg:text-[5.5vw] font-sans font-black tracking-tighter leading-[0.95] lg:leading-[0.9]">
            <span className="block text-foreground mb-2">
              {t("redefining")}
            </span>
            <span className="relative inline-block">
              <span className="relative z-10 text-gradient-gold">
                {t("luxuryStyle")}
              </span>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1.2, ease: "easeInOut" }}
                className="absolute bottom-2 left-0 h-3 bg-accent/30 -z-1 rounded-full"
              />
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
            <Link href="/shop">
              <GlassButton
                size="lg"
                variant="primary"
                className="group h-14 lg:h-16 px-8 lg:px-10 rounded-full border-none shadow-2xl shadow-primary/30"
              >
                <span className="font-bold tracking-wide">
                  {t("shopCollection")}
                </span>
                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2" />
              </GlassButton>
            </Link>
            <Link href="/about">
              <GlassButton
                variant="outline"
                size="lg"
                className="h-14 lg:h-16 px-8 lg:px-10 rounded-full border-2 border-foreground/10 text-foreground hover:bg-foreground/5 hover:border-foreground/30 font-bold"
              >
                {t("ourStory")}
              </GlassButton>
            </Link>
          </div>

          {/* Trust Badges - Refined & Minimal */}
          <motion.div
            className="grid grid-cols-2 md:flex md:flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-foreground/5 justify-center lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <TrustBadge
              icon={<Truck className="w-4 h-4" />}
              label={t("freeShipping")}
              color="accent"
            />
            <TrustBadge
              icon={<Lock className="w-4 h-4" />}
              label={t("securePayments")}
              color="accent"
            />
            <TrustBadge
              icon={<Shield className="w-4 h-4" />}
              label={t("premiumQuality")}
              color="accent"
            />
          </motion.div>
        </motion.div>

        {/* Visual Content - Statement Image */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-[50vh] lg:h-[85vh] hidden lg:block group"
        >
          {/* Circular Accent */}
          <div className="absolute -top-12 -right-12 w-[30vw] h-[30vw] bg-accent/10 rounded-full blur-[80px] group-hover:bg-accent/20 transition-colors duration-1000" />

          <motion.div
            initial={{ scale: 0.9, rotate: -2 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}
            className="relative h-full w-full rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-neutral-900 group-hover:shadow-accent/10 transition-shadow duration-700"
          >
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
              src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1200&q=90"
              alt="Luxury Living Room Interior"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
              priority
              onLoad={() => setIsImageReady(true)}
            />

            {/* Glass Overlay Card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute bottom-8 left-8 right-8 p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">
                  {t("featuredLook")}
                </p>
                <p className="text-xl font-serif italic text-white">
                  {t("silkEveningDress")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-warning">$1,299</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBadge({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "warning" | "primary" | "accent";
}) {
  const colors = {
    warning: "text-warning bg-warning/10 border-warning/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "p-2 rounded-xl border backdrop-blur-sm shadow-xs",
          colors[color]
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-bold text-muted-foreground/80 tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}
