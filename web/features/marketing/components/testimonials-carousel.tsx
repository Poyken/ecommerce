"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";

/**
 * =====================================================================
 * TESTIMONIALS CAROUSEL - Slider đánh giá của khách hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HEADLESS CAROUSEL (Embla):
 * - Khác với Slick hay Swiper có sẵn UI, Embla chỉ cung cấp Logic (API).
 * - Ưu điểm: Siêu nhẹ, mượt (dùng native scroll), và ta có thể tùy biến UI 100% theo ý thích.
 *
 * 2. MOUSE WHEEL CONTROL:
 * - Một tính năng UX cao cấp: Cho phép user cuộn chuột (Mouse Wheel) hoặc vuốt touchpad để lướt slider ngang.
 * - Logic `wheelListener`: Chuyển đổi sự kiện cuộn dọc (`deltaY`) thành lệnh cuộn ngang (`scrollNext/Prev`).
 *
 * 3. VISUAL POLISH (Gradient Masks):
 * - Hai lớp overlay mờ dần ở 2 cạnh trái phải (`bg-linear-to-r`).
 * - Tạo cảm giác "Vô tận" (Infinity), che đi điểm cắt đột ngột của các card ở mép màn hình.
 * =====================================================================
 */

interface TestimonialsCarouselProps {
  items?: Array<{ text: string; author: string; role: string; rating?: number; avatar?: string }>;
}

export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const t = useTranslations("home.testimonials");
  const testimonialsRaw = items || (t.raw("items") as {
    text: string;
    author: string;
    role: string;
  }[]);

  const testimonials = testimonialsRaw.map((item: any, index: number) => ({
    ...item,
    id: index + 1,
    rating: item.rating || 5, // Default rating as it's not in translation for now
    avatar: item.avatar || `/images/testimonials/person-${(index % 6) + 1}.webp`,
  }));

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { align: "start" },
    },
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Mouse wheel support
  useEffect(() => {
    if (!emblaApi) return;

    const wheelListener = (e: WheelEvent) => {
      // Luôn preventDefault để chặn cuộn trang dọc khi đang hover vào carousel
      e.preventDefault();

      const threshold = 15; // Giảm ngưỡng để nhạy hơn với thao tác cuộn chuột

      // Xử lý cả cuộn ngang (touchpad) và dọc (mouse wheel) để scroll carousel
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Cuộn ngang (Touchpad)
        if (e.deltaX > threshold) emblaApi.scrollNext();
        else if (e.deltaX < -threshold) emblaApi.scrollPrev();
      } else {
        // Cuộn dọc (Mouse wheel) -> Chuyển thành cuộn carousel ngang
        if (e.deltaY > threshold) emblaApi.scrollNext();
        else if (e.deltaY < -threshold) emblaApi.scrollPrev();
      }
    };

    const viewport = emblaApi.rootNode();
    viewport.addEventListener("wheel", wheelListener as EventListener, {
      passive: false,
    });

    return () => {
      viewport.removeEventListener("wheel", wheelListener as EventListener);
    };
  }, [emblaApi]);

  return (
    <div className="relative group overflow-hidden">
      {/* Navigation Buttons - Positioned Inside */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden md:block">
        <GlassButton
          size="icon"
          onClick={scrollPrev}
          className="w-12 h-12 rounded-full bg-foreground/5 hover:bg-accent/10 border-foreground/10 hover:border-accent/30 backdrop-blur-xl shadow-2xl hover:shadow-accent/10 transition-all duration-300"
        >
          <ChevronLeft className="text-foreground" size={20} />
        </GlassButton>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden md:block">
        <GlassButton
          size="icon"
          onClick={scrollNext}
          className="w-12 h-12 rounded-full bg-foreground/5 hover:bg-accent/10 border-foreground/10 hover:border-accent/30 backdrop-blur-xl shadow-2xl hover:shadow-accent/10 transition-all duration-300"
        >
          <ChevronRight className="text-foreground" size={20} />
        </GlassButton>
      </div>

      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Embla Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 py-8 px-4">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="flex-none w-[85vw] md:w-[400px] min-w-0 cursor-grab active:cursor-grabbing"
            >
              <GlassCard className="h-full p-10 space-y-6 bg-foreground/2 border-foreground/5 hover:border-accent/20 transition-all duration-500 rounded-4xl hover:shadow-2xl hover:shadow-accent/10">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < item.rating
                          ? "text-accent text-2xl"
                          : "text-muted-foreground/10 text-2xl"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-base text-foreground/80 leading-relaxed font-medium">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-foreground/5">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-foreground/10 shadow-sm">
                    <UserAvatar
                      src={item.avatar}
                      alt={item.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-black text-foreground tracking-tight">
                      {item.author}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {item.role}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Hint Mobile */}
      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {testimonials.map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
        ))}
      </div>
    </div>
  );
}
