"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * =====================================================================
 * GLASS CARD - Thẻ nội dung hiệu ứng kính mờ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BACKDROP BLUR:
 * - Đây là linh hồn của Glassmorphism. Nó làm mờ phần nền PHÍA SAU card.
 * - `backdrop-blur-md` (Medium) hoặc `backdrop-blur-xl` (Extra Large) tùy vào biến thể.
 *
 * 2. LAYERED BACKGROUND:
 * - Kết hợp `bg-white/60` (Light mode) và `bg-white/5` (Dark mode) để đảm bảo nội dung luôn dễ đọc trên mọi loại nền.
 *
 * 3. ADAPTIVE VARIANTS:
 * - `default`: Dùng cho các card thông thường.
 * - `hover`: Có thêm hiệu ứng đổi màu nền và đổ bóng khi di chuột.
 * - `heavy`: Độ mờ cao hơn, dùng cho các modal hoặc popup quan trọng.
 * =====================================================================
 */

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "hover" | "heavy";
}

export function GlassCard({
  children,
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  const variants = {
    default:
      "bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border-foreground/5 dark:border-white/5 text-foreground shadow-lg",
    hover:
      "bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border-foreground/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/[0.05] hover:border-foreground/10 dark:hover:border-white/10 hover:shadow-2xl transition-all duration-500 text-foreground",
    heavy:
      "bg-white/90 dark:bg-black/40 backdrop-blur-2xl border-foreground/10 dark:border-white/5 text-foreground shadow-2xl",
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
