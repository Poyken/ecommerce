

"use client";

import { m } from "@/lib/animations";

interface MarqueeBlockProps {
  items?: string[];
  speed?: number;
  direction?: "left" | "right";

  styles?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
  };
}

export function MarqueeBlock({
  items = [
    "PREMIUM QUALITY",
    "GLOBAL SHIPPING",
    "CONCIERGE SERVICE",
    "EXPERT CRAFTSMANSHIP",
    "TIMELESS DESIGN",
  ],
  speed = 30,
  direction = "left",

  styles,
}: MarqueeBlockProps) {
  const duration = speed;

  return (
    <section
      className="py-12 border-y border-border/50 overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <div className="relative flex overflow-x-hidden w-full whitespace-nowrap">
        <m.div
          className="flex whitespace-nowrap"
          animate={{ x: direction === "left" ? [0, "-50%"] : ["-50%", 0] }}
          transition={{
            ease: "linear",
            duration: duration,
            repeat: Infinity,
          }}
        >
          <div className="flex gap-12 items-center px-6">
            {items.map((text, idx) => (
              <div key={idx} className="flex items-center gap-12">
                <span
                  className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tighter opacity-80 shrink-0"
                  style={{ fontSize: styles?.fontSize }}
                >
                  {text}
                </span>
                <div className="w-4 h-4 rounded-full bg-primary/40 shrink-0" />
              </div>
            ))}
          </div>
          <div className="flex gap-12 items-center px-6">
            {items.map((text, idx) => (
              <div key={idx} className="flex items-center gap-12">
                <span
                  className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tighter opacity-80 shrink-0"
                  style={{ fontSize: styles?.fontSize }}
                >
                  {text}
                </span>
                <div className="w-4 h-4 rounded-full bg-primary/40 shrink-0" />
              </div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
