"use client";

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MouseEvent, useRef, useState } from "react";

const testimonials = [
  {
    id: 1,
    text: "Absolutely stunning quality. The attention to detail is unmatched. I've never received so many compliments.",
    author: "Sarah Jenkins",
    role: "Verified Buyer",
    rating: 5,
  },
  {
    id: 2,
    text: "The shopping experience was seamless, and the packaging made unboxing feel like a special event. Highly recommend!",
    author: "Michael Chen",
    role: "Regular Customer",
    rating: 5,
  },
  {
    id: 3,
    text: "I was hesitant at first, but the quality exceeded my expectations. Fast shipping and excellent customer support.",
    author: "Emma Wilson",
    role: "Verified Buyer",
    rating: 5,
  },
  {
    id: 4,
    text: "Beautiful design and premium materials. It's clearly built to last. A wonderful addition to my collection.",
    author: "David Thompson",
    role: "Verified Buyer",
    rating: 4,
  },
];

export function TestimonialsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400; // Approx card width
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="relative group">
      {/* Navigation Buttons - Positioned Inside */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden md:block">
        <GlassButton 
            size="icon" 
            onClick={() => scroll("left")}
            className="rounded-full bg-black/50 hover:bg-black/70 border-white/10 backdrop-blur-md"
        >
            <ChevronLeft className="text-white" />
        </GlassButton>
      </div>
      
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden md:block">
        <GlassButton 
            size="icon" 
            onClick={() => scroll("right")}
            className="rounded-full bg-black/50 hover:bg-black/70 border-white/10 backdrop-blur-md"
        >
            <ChevronRight className="text-white" />
        </GlassButton>
      </div>

      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className={cn(
            "flex gap-6 overflow-x-auto pb-8 pt-2 px-4 scrollbar-hide -mx-4 md:mx-0 select-none",
            isDragging ? "cursor-grabbing snap-none" : "cursor-grab snap-x snap-mandatory"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="flex-none w-[85vw] md:w-[400px] snap-center pointer-events-none md:pointer-events-auto"
          >
            <GlassCard className="h-full p-8 space-y-6 bg-white/5 border-white/10 hover:border-primary/20 transition-colors">
              <div className="flex gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < item.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"}>★</span>
                ))}
              </div>
              <p className="text-lg italic text-foreground/90 leading-relaxed font-secondary">
                "{item.text}"
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10" />
                <div>
                  <div className="font-bold text-foreground">{item.author}</div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
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
