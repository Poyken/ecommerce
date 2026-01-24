"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TypedLink, appRoutes } from "@/lib/typed-navigation";



interface DealSectionProps {
  targetDate?: Date; // Optional: specific date to count down to
  title?: string;
  summerTitle?: string;
  collectionTitle?: string;
  description?: string;
}

export function DealSection({ targetDate, title, summerTitle, collectionTitle, description }: DealSectionProps) {
  // Default target date: 3 days from now if not provided
  const [target] = useState<Date>(() => {
    if (targetDate) return targetDate;
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date;
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const t = useTranslations("home.deal");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = target.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial call

    return () => clearInterval(timer);
  }, [target]);


  return (
    <section className="container mx-auto px-4 py-24 relative">
      {/* Aurora Glows */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[var(--aurora-purple)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--aurora-blue)]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="relative rounded-[2.5rem] overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl group">
        <div className="flex flex-col md:flex-row items-center">
          {/* Content */}
          <div className="w-full md:w-1/2 p-8 md:p-16 space-y-10 z-10 relative">
            <div className="space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-[0.3em] text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                {title || t("title")}
              </span>
              <h2 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase text-white italic">
                {summerTitle || t("summer")} <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-indigo-400 not-italic">
                  {collectionTitle || t("collection")}
                </span>
              </h2>
              <p className="text-muted-foreground/80 text-lg max-w-md leading-relaxed font-medium">
                {description || t("description")}
              </p>
            </div>

            {/* Countdown */}
            <div className="flex gap-4 md:gap-6">
              <TimeUnit value={timeLeft.days} label={t("days")} />
              <TimeUnit value={timeLeft.hours} label={t("hours")} />
              <TimeUnit value={timeLeft.minutes} label={t("mins")} />
              <TimeUnit value={timeLeft.seconds} label={t("secs")} />
            </div>

            <div className="flex flex-wrap gap-5 pt-8 border-t border-white/5">
              <TypedLink
                href={appRoutes.shop}
                className="inline-flex items-center justify-center rounded-2xl px-12 h-16 text-xs font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/20"
              >
                {t("shopNow")}
              </TypedLink>
              <TypedLink
                href={appRoutes.shop}
                className="inline-flex items-center justify-center gap-3 rounded-2xl px-12 h-16 text-xs font-black uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 transition-all group backdrop-blur-md"
              >
                {t("viewAll")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </TypedLink>
            </div>
          </div>

          {/* Image */}
          <div className="w-full md:w-1/2 relative min-h-[500px] md:min-h-[700px] overflow-hidden">
            <div className="absolute inset-0 w-full h-full transition-transform duration-1000 group-hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-10 pointer-events-none opacity-60" />
              <Image
                src="/images/home/deal-sofa.jpg"
                alt="Luxury Living Room Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-white/5 backdrop-blur-xl rounded-2xl p-4 min-w-[90px] shadow-2xl border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group">
      <span className="text-4xl font-black tabular-nums tracking-tighter text-white group-hover:text-primary transition-colors text-shadow-sm">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mt-2 group-hover:text-primary/60 transition-colors">
        {label}
      </span>
    </div>
  );
}
