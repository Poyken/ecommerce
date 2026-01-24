"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";



interface Testimonial {
  text: string;
  author: string;
  role: string;
  rating?: number;
  avatar?: string;
}

interface TestimonialsCarouselProps {
  items?: Testimonial[];
}

export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const t = useTranslations("home.testimonials");
  const testimonialsRaw = items || (t.raw("items") as Testimonial[]);

  const testimonials = testimonialsRaw.map((item, index) => ({
    ...item,
    id: index + 1,
    rating: item.rating || 5,
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
    <div className="relative group overflow-hidden py-12">
      {/* Navigation Buttons - Positioned Inside */}
      <div className="absolute top-1/2 -translate-y-1/2 left-8 z-20 hidden md:block">
        <GlassButton
          size="icon"
          onClick={scrollPrev}
          className="w-16 h-16 rounded-full bg-black/20 hover:bg-black/40 border-white/10 hover:border-primary/30 backdrop-blur-xl shadow-2xl hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 group/btn"
        >
          <ChevronLeft className="text-white group-hover/btn:scale-125 transition-transform" size={24} />
        </GlassButton>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-8 z-20 hidden md:block">
        <GlassButton
          size="icon"
          onClick={scrollNext}
          className="w-16 h-16 rounded-full bg-black/20 hover:bg-black/40 border-white/10 hover:border-primary/30 backdrop-blur-xl shadow-2xl hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 group/btn"
        >
          <ChevronRight className="text-white group-hover/btn:scale-125 transition-transform" size={24} />
        </GlassButton>
      </div>

      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />

      {/* Aurora Glow Background */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--aurora-purple)]/5 blur-[100px] pointer-events-none -z-10" />

      {/* Embla Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 py-8 px-4">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="flex-none w-[85vw] md:w-[400px] min-w-0 cursor-grab active:cursor-grabbing"
            >
              <div className="glass-premium h-full p-10 space-y-8 bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 transition-all duration-500 rounded-[2.5rem] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 group/card">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < item.rating
                          ? "text-primary text-xl"
                          : "text-white/10 text-xl"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-lg text-white/80 leading-relaxed font-medium italic">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="flex items-center gap-5 pt-6 border-t border-white/5">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover/card:scale-110 transition-transform duration-500">
                    <UserAvatar
                      src={item.avatar}
                      alt={item.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-black text-white text-lg tracking-tight uppercase">
                      {item.author}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                      {item.role}
                    </div>
                  </div>
                </div>
              </div>
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
