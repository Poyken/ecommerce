"use client";

import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";

interface StatsBlockProps {
  stats?: Array<{
    label: string;
    value: string;
    color: "primary" | "secondary";
  }>;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}


export function StatsBlock({ stats, styles }: StatsBlockProps) {
  const t = useTranslations("home");

  const defaultStats = [
    { label: "happyCustomers", value: "10k+", color: "primary" },
    { label: "premiumProducts", value: "500+", color: "secondary" },
    { label: "globalBrands", value: "50+", color: "primary" },
    { label: "customerSupport", value: "24/7", color: "secondary" },
  ];

  const items = stats || defaultStats;

  return (
    <section
      className="container mx-auto px-4 py-12"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <m.div
        className="grid grid-cols-2 md:grid-cols-4 gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {items.map((stat: any, idx) => (
          <m.div
            key={idx}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="group relative text-center p-8 rounded-4xl bg-foreground/2 border border-foreground/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
          >
            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary/20 group-hover:scale-150 transition-transform duration-500" />
            <h3
              className={cn(
                "text-5xl font-black mb-2 tracking-tighter transition-transform duration-500 group-hover:-translate-y-1",
                stat.color === "primary"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {stat.value}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              {/* Use translation if key exists, else raw label */}
              {stat.label.includes(" ") ? stat.label : t(stat.label)}
            </p>
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
