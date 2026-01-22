"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { m } from "@/lib/animations";
import { ArrowRight } from "lucide-react";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";

interface CTASectionProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}


export function CTASection({
  title,
  subtitle,
  buttonText,
  buttonLink,
  styles,
}: CTASectionProps) {
  return (
    <section
      className="py-24 px-4 relative w-full overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-secondary/30 -z-10" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/50 to-background -z-10" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
        }}
      />

      <m.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center space-y-10"
      >
        <div className="space-y-6">
          <h2 className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            {subtitle}
          </p>
        </div>
        <div>
          <TypedLink href={buttonLink as AppRoute}>
            <GlassButton
              size="lg"
              className="rounded-full px-10 h-14 text-lg border-primary/20 hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 hover:shadow-primary/20 group"
            >
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </GlassButton>
          </TypedLink>
        </div>
      </m.div>
    </section>
  );
}
