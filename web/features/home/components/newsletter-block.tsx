"use client";

import { NewsletterForm } from "@/features/marketing/components/newsletter-form";
import { scaleUp } from "@/lib/animations";
import { m } from "framer-motion";

interface NewsletterBlockProps {
  title?: string;
  description?: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * =================================================================================================
 * NEWSLETTER BLOCK - KHỐI ĐĂNG KÝ NHẬN TIN
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLASSMORPHISM DESIGN:
 *    - Sử dụng `backdrop-blur-xl` và `bg-foreground/2` để tạo hiệu ứng kính mờ hiện đại.
 *    - Kết hợp với 2 đốm sáng (blur-circles) ở góc giúp UI có chiều sâu và cao cấp.
 *
 * 2. REUSABLE FORM:
 *    - Tách logic form vào `NewsletterForm` để xử lý validation (Zod) và gọi API.
 *    - Header này chỉ quan tâm tới visual và thông điệp truyền tải. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function NewsletterBlock({
  title,
  description,
  styles,
}: NewsletterBlockProps) {
  return (
    <m.section
      className="container mx-auto px-4 py-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={scaleUp}
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <div className="relative overflow-hidden bg-foreground/2 rounded-[3rem] p-12 md:p-24 text-center border border-foreground/5 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

        {title && (
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic mb-4 relative z-10">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-muted-foreground mb-8 relative z-10 max-w-2xl mx-auto">
            {description}
          </p>
        )}

        <NewsletterForm />
      </div>
    </m.section>
  );
}
