"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * DEAL SECTION - Section hiển thị khuyến mãi giới hạn thời gian
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COUNTDOWN LOGIC:
 * - Sử dụng `setInterval` để cập nhật thời gian còn lại mỗi giây.
 * - `calculateTimeLeft`: Hàm tính toán sự chênh lệch giữa thời gian hiện tại và `targetDate`.
 * - Cleanup: Luôn gọi `clearInterval` trong return của `useEffect` để tránh memory leak.
 *
 * 2. CLIENT-SIDE STATE:
 * - `timeLeft` state lưu trữ { days, hours, minutes, seconds }.
 * - Khi state thay đổi, React sẽ re-render component để hiển thị con số mới.
 *
 * 3. TABULAR NUMS:
 * - CSS `tabular-nums` giúp các con số có độ rộng bằng nhau -> Tránh hiện tượng chữ bị "nhảy" khi số thay đổi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

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
    <section className="container mx-auto px-4 py-12">
      <div className="relative rounded-[2.5rem] overflow-hidden bg-secondary/30 dark:bg-white/5 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center">
          {/* Content */}
          <div className="w-full md:w-1/2 p-8 md:p-16 space-y-10 z-10">
            <div className="space-y-4">
              <span className="text-accent font-bold uppercase tracking-[0.3em] text-xs">
                {title || t("title")}
              </span>
              <h2 className="text-5xl md:text-7xl font-sans font-extrabold leading-[1.1] tracking-tight">
                {summerTitle || t("summer")} <br />
                <span className="text-primary italic font-serif">
                  {collectionTitle || t("collection")}
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-sm leading-relaxed">
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

            <div className="flex flex-wrap gap-5 pt-4">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full px-12 h-16 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25"
              >
                {t("shopNow")}
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-3 rounded-full px-12 h-16 text-base font-semibold border-2 border-primary/20 bg-background/50 hover:bg-accent hover:border-primary transition-all group"
              >
                {t("viewAll")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="w-full md:w-1/2 relative min-h-[500px] md:min-h-[600px] group overflow-hidden">
            <div className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
              <Image
                src="/images/home/deal-sofa.jpg"
                alt="Luxury Living Room Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top"
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
    <div className="flex flex-col items-center bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-2xl p-4 min-w-[85px] shadow-sm border border-black/5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group">
      <span className="text-3xl font-black tabular-nums tracking-tighter group-hover:text-accent transition-colors">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}
