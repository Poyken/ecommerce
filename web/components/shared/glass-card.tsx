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
 * 1. GLASSMORPHISM CORE:
 * - Phong cách thiết kế mô phỏng tấm kính mờ đặt trên nền.
 * - `backdrop-blur-xl`: Mấu chốt!. Làm mờ những gì NẰM SAU nó (background cha).
 * - `bg-white/60`: Nền phải bán trong suốt (alpha < 1) thì mới thấy hiệu ứng blur.
 *
 * 2. BORDER SUBTLETY (Viền tinh tế):
 * - Để tạo cảm giác "tấm kính dày", ta thêm viền rất mờ (`border-white/10`).
 * - Viền này mô phỏng cạnh kính bắt sáng.
 *
 * 3. VARIANT SYSTEM:
 * - `hover`: Khi di chuột vào, tăng shadow và độ sáng -> Tạo cảm giác thẻ "nổi lên".
 * - `heavy`: Dùng cho Modal/Popup cần che nền mạnh hơn để user tập trung nội dung.
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
      className={cn("rounded-2xl border", variants[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
