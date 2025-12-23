"use client";

import { GlassCard } from "@/components/atoms/glass-card";
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
 * - Sử dụng `GlassCard` để tạo hiệu ứng kính mờ đồng bộ với toàn app.
 * =====================================================================
 */

export function FAQAccordion() {
  const t = useTranslations("home.faq");
  const faqs = t.raw("items") as { question: string; answer: string }[];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const getColorClasses = (index: number) => {
    return {
      activeBg: "bg-accent/5",
      activeBorder: "border-accent/20 shadow-2xl shadow-accent/5",
      activeText: "text-accent",
      hover: "hover:bg-accent/[0.02] hover:border-accent/10",
      badge: "bg-accent/10 text-accent",
    };
  };

  return (
    <div className="space-y-5">
      {faqs.map((faq, i) => {
        const colors = getColorClasses(i);
        const isOpen = openIndex === i;

        return (
          <GlassCard
            key={i}
            className={cn(
              "px-8 py-6 cursor-pointer transition-all duration-300 border rounded-4xl",
              isOpen
                ? `${colors.activeBg} ${colors.activeBorder}`
                : `bg-foreground/2 border-foreground/5 ${colors.hover}`
            )}
            onClick={() => setOpenIndex(isOpen ? null : i)}
          >
            <div className="flex justify-between items-center gap-6">
              <div className="flex items-center gap-5 flex-1">
                <span
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all duration-500",
                    colors.badge
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "transition-colors duration-500 font-bold text-base",
                    isOpen ? colors.activeText : "text-foreground"
                  )}
                >
                  {faq.question}
                </span>
              </div>
              <span
                className={cn(
                  "transition-transform duration-500 text-xl font-bold shrink-0",
                  isOpen
                    ? `rotate-180 ${colors.activeText}`
                    : "text-muted-foreground/40"
                )}
              >
                ▼
              </span>
            </div>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-foreground/5"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden leading-relaxed text-muted-foreground/80 font-medium">
                {faq.answer}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
