"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * FAQ ACCORDION - Danh sách câu hỏi thường gặp
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCORDION LOGIC:
 * - `openIndex` lưu index của câu hỏi đang mở.
 * - Nếu click vào câu hỏi đang mở -> Đóng lại (set null).
 *
 * 2. CSS GRID ANIMATION (Trick):
 * - Để animate chiều cao từ 0 đến auto, ta dùng `grid-template-rows`.
 * - `grid-rows-[0fr]` (đóng) và `grid-rows-[1fr]` (mở).
 * - Kết hợp với `transition-all` để có hiệu ứng mượt mà mà không cần JS tính toán height.
 *
 * 3. STYLING:
 * - Sử dụng `GlassCard` để tạo hiệu ứng kính mờ đồng bộ với toàn app. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */



interface FAQAccordionProps {
  items?: Array<{ question: string; answer: string }>;
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const t = useTranslations("home.faq");
  const faqs =
    items || (t.raw("items") as { question: string; answer: string }[]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;

        return (
          <div
            key={i}
            className={cn(
              "group rounded-[2rem] border transition-all duration-500 overflow-hidden relative isolate",
              isOpen
                ? "bg-white/5 border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
                : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5"
            )}
          >
            {/* Active Glow Background */}
            <div
              className={cn(
                "absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 -z-10",
                isOpen && "opacity-100"
              )}
            />

            <div
              className="px-8 py-6 cursor-pointer flex justify-between items-center gap-6"
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <div className="flex items-center gap-6 flex-1">
                <span
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-2xl text-sm font-black transition-all duration-500 shadow-inner",
                    isOpen
                      ? "bg-primary text-white shadow-primary/20 scale-110"
                      : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60"
                  )}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    "transition-all duration-500 font-bold text-lg md:text-xl tracking-tight",
                    isOpen ? "text-white" : "text-white/70 group-hover:text-white"
                  )}
                >
                  {faq.question}
                </span>
              </div>
              <span
                className={cn(
                  "transition-all duration-500 text-2xl font-black shrink-0 flex items-center justify-center w-10 h-10 rounded-full",
                  isOpen
                    ? "rotate-180 text-primary bg-primary/10"
                    : "text-white/20 group-hover:text-white/40"
                )}
              >
                ▼
              </span>
            </div>
            <div
              className={cn(
                "grid transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                isOpen
                  ? "grid-rows-[1fr] opacity-100 pb-8 px-8 md:pl-[6.5rem]"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden leading-relaxed text-muted-foreground/80 font-medium text-lg border-t border-white/5 pt-6">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
