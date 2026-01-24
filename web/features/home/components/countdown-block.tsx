

"use client";

import { useEffect, useState } from "react";

import { m } from "@/lib/animations";
import { Button } from "@/components/ui/button";

interface CountdownBlockProps {
  title?: string;
  subtitle?: string;
  targetDate?: string;
  ctaText?: string;
  ctaLink?: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export function CountdownBlock({
  title = "Exclusive Sales Event",
  subtitle = "Our seasonal luxury collection is almost here. Stay tuned for amazing offers.",
  targetDate = "2026-12-31T23:59:59",
  ctaText = "Notify Me",
  ctaLink = "/contact",
  styles,
}: CountdownBlockProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <section
      className="py-20 px-4 bg-slate-900 text-white overflow-hidden relative"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -ml-48 -mb-48" />

      <div className="container mx-auto max-w-5xl relative z-10 text-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold">{title}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">{subtitle}</p>
        </m.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto mb-12">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((item, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 backdrop-blur-md p-6 md:p-8 rounded-4xl flex flex-col items-center justify-center"
            >
              <span className="text-4xl md:text-5xl font-serif font-bold tabular-nums mb-2">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                {item.label}
              </span>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button
            asChild
            className="h-14 px-12 rounded-full font-bold text-lg hover:scale-105 transition-transform bg-primary text-primary-foreground"
          >
            <a href={ctaLink}>{ctaText}</a>
          </Button>
        </m.div>
      </div>
    </section>
  );
}
