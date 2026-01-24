"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { m } from "@/lib/animations";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";

interface BannerSectionProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}


export function BannerSection({
  title,
  subtitle,
  imageUrl,
  ctaText,
  ctaLink,
  styles,
}: BannerSectionProps) {
  return (
    <section
      className="relative w-full py-32 px-4 flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      {/* Background Image/Color */}
      {imageUrl ? (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-primary z-0">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-accent/20 to-transparent" />
        </div>
      )}

      <m.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-4xl space-y-8"
      >
        <div className="space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-[0.2em] font-medium">
            Limited Edition
          </span>
          <h2 className="text-4xl md:text-6xl font-serif font-medium text-white tracking-tight drop-shadow-sm leading-tight">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
            {subtitle}
          </p>
        </div>

        {ctaText && ctaLink && (
          <div className="pt-4">
            <TypedLink href={(ctaLink || "#") as AppRoute}>
              <GlassButton
                size="lg"
                variant="outline"
                className="rounded-full px-10 h-14 border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase"
              >
                {ctaText}
              </GlassButton>
            </TypedLink>
          </div>
        )}
      </m.div>
    </section>
  );
}
