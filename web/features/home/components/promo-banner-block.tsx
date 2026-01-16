"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { m } from "@/lib/animations";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface PromoBannerBlockProps {
  title: string;
  subtitle: string;
  discountText?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  auroraVariant?: "blue" | "purple" | "orange" | "cinematic";
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    height?: string;
  };
}

export function PromoBannerBlock({
  title,
  subtitle,
  discountText,
  imageUrl,
  ctaText,
  ctaLink,
  auroraVariant = "cinematic",
  styles,
}: PromoBannerBlockProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden flex items-center justify-center py-24 px-6 md:py-32 rounded-3xl",
        styles?.height || "min-h-[500px]"
      )}
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      {/* Background Media */}
      {imageUrl && (
        <div className="absolute inset-0 z-0">
          <m.div 
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
        </div>
      )}

      {/* Aurora Glows */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
        {auroraVariant === "blue" && (
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[70%] bg-blue-500/20 blur-[120px] rounded-full animate-pulse" />
        )}
        {auroraVariant === "purple" && (
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[70%] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" />
        )}
        {auroraVariant === "cinematic" && (
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/15 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-orange-600/10 blur-[120px] rounded-full" />
          </>
        )}
      </div>

      {/* Content */}
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-5xl w-full"
      >
        <div className="glass-premium p-8 md:p-16 rounded-[40px] border border-white/10 flex flex-col items-center text-center space-y-8 shadow-2xl">
          {discountText && (
            <m.div
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/30 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-accent text-xs font-bold uppercase tracking-widest leading-none">
                {discountText}
              </span>
            </m.div>
          )}

          <div className="space-y-4">
            <h2 className="text-5xl md:text-8xl font-serif tracking-tight text-white leading-[1.1]">
              {title}
            </h2>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          {ctaText && ctaLink && (
            <m.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <TypedLink href={ctaLink as AppRoute}>
                <m.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GlassButton
                    size="lg"
                    className="rounded-full px-12 h-16 text-lg font-bold tracking-tight bg-white text-black hover:bg-accent hover:text-white transition-all duration-500 shadow-xl"
                  >
                    {ctaText}
                  </GlassButton>
                </m.div>
              </TypedLink>
            </m.div>
          )}
        </div>
      </m.div>
    </section>
  );
}
