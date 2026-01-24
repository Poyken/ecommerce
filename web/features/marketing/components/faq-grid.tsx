

"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { m } from "@/lib/animations";
import { useTranslations } from "next-intl";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: (i: number) => ({
    opacity: 0,
    x: i === 0 ? -50 : i === 1 ? 50 : 0,
    y: i >= 2 ? 50 : 0,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FAQGrid() {
  const t = useTranslations("contact");

  const faqs = [
    {
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/30",
      shadow: "hover:shadow-accent/10",
      hoverBg: "group-hover:bg-accent/20",
      hoverText: "group-hover:text-accent",
    },
    {
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/30",
      shadow: "hover:shadow-accent/10",
      hoverBg: "group-hover:bg-accent/20",
      hoverText: "group-hover:text-accent",
    },
    {
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/30",
      shadow: "hover:shadow-accent/10",
      hoverBg: "group-hover:bg-accent/20",
      hoverText: "group-hover:text-accent",
    },
    {
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/30",
      shadow: "hover:shadow-accent/10",
      hoverBg: "group-hover:bg-accent/20",
      hoverText: "group-hover:text-accent",
    },
  ];

  return (
    <m.div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {faqs.map((item, i) => (
        <m.div
          variants={itemVariants}
          custom={i}
          key={i}
          className="h-full"
        >
          <GlassCard
            className={`p-8 h-full transition-all duration-300 group border border-foreground/5 ${item.border} hover:shadow-2xl ${item.shadow} rounded-4xl bg-foreground/2 backdrop-blur-md`}
          >
            <div className="flex items-start gap-6">
              <div
                className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 ${item.hoverBg} transition-all duration-300 shadow-sm`}
              >
                <span className={`${item.text} font-black text-xl`}>
                  {i + 1}
                </span>
              </div>
              <div className="space-y-3">
                <h3
                  className={`font-bold text-foreground text-lg leading-tight ${item.hoverText} transition-colors`}
                >
                  {t(`faq.q${i + 1}`)}
                </h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
                  {t(`faq.a${i + 1}`)}
                </p>
              </div>
            </div>
          </GlassCard>
        </m.div>
      ))}
    </m.div>
  );
}
