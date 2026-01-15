/**
 * =====================================================================
 * VIDEO HERO BLOCK - BANNER VIDEO CINEMATIC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Tạo ấn tượng mạnh đầu tiên cho trang web bằng Video chất lượng cao.
 * Có chức năng Mute/Unmute và Glassmorphism buttons cực kỳ cao cấp. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { cn } from "@/lib/utils";
import { m } from "@/lib/animations";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "@/i18n/routing";

interface VideoHeroBlockProps {
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  fallbackImage?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  height?: "small" | "medium" | "large" | "full";
  alignment?: "left" | "center" | "right";
  theme?: "classic" | "modern" | "luxury";
}

export function VideoHeroBlock({
  title = "Pure Elegance in Motion",
  subtitle = "Experience our collection like never before with cinematic visuals and bespoke storytelling.",
  videoUrl = "https://cdn.pixabay.com/video/2021/04/12/70860-537446549_tiny.mp4",
  fallbackImage = "/images/home/hero-luxury.jpg",
  ctaText = "Watch Collection",
  ctaLink = "/shop",
  overlayOpacity = 0.5,
  height = "large",
  alignment = "center",
  theme = "luxury",
}: VideoHeroBlockProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const heightMap = {
    small: "h-[50vh]",
    medium: "h-[70vh]",
    large: "h-[85vh]",
    full: "h-screen",
  };

  const alignmentMap = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <section
      className={cn("relative w-full overflow-hidden", heightMap[height])}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105"
        poster={fallbackImage}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-1000"
        style={{ opacity: overlayOpacity }}
      />

      {/* Luxury Cinematic Effect */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/40" />

      {/* Content */}
      <div
        className={cn(
          "container relative z-10 h-full mx-auto px-6 flex flex-col justify-center",
          alignmentMap[alignment]
        )}
      >
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl space-y-8"
        >
          <div className="space-y-4">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
            >
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                Cinematic Reveal
              </span>
            </m.div>

            <h2
              className={cn(
                "text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-tight tracking-tighter",
                theme === "modern" && "font-sans uppercase font-black italic"
              )}
            >
              {title}
            </h2>

            <p className="text-lg md:text-2xl text-white/70 font-light max-w-2xl leading-relaxed mx-auto italic">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 justify-center">
            <Link href={ctaLink as any}>
              <GlassButton
                variant="primary"
                size="lg"
                className="h-16 px-12 text-sm font-black uppercase tracking-widest group"
              >
                <span className="flex items-center gap-3">
                  {ctaText}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </span>
              </GlassButton>
            </Link>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </m.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 left-12 z-20 hidden lg:block">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em]">
            Audio
          </span>
          <span className="text-xs text-white/80 font-medium">
            {isMuted ? "MUTED" : "ON AIR"}
          </span>
        </div>
      </div>
    </section>
  );
}
