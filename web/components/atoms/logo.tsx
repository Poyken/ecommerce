/**
 * =====================================================================
 * LOGO - Thành phần hiển thị biểu tượng thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BRAND IDENTITY:
 * - Hiển thị tên thương hiệu "LUXE" với phong cách hiện đại (font-black, tracking-tighter).
 * - Sử dụng `motion.div` để tạo hiệu ứng xoay nhẹ khi hover, tăng tính sinh động.
 *
 * 2. VARIANTS & SIZES:
 * - Hỗ trợ nhiều kích thước (sm, md, lg) và biến thể màu sắc (light, dark) để linh hoạt sử dụng ở Header, Footer hoặc Sidebar.
 * =====================================================================
 */

"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark" | "default";
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
}

export function Logo({
  className,
  variant = "default",
  size = "md",
  collapsed = false,
}: LogoProps) {
  const sizes = {
    sm: { box: "w-8 h-8", text: "text-lg", char: "text-base" },
    md: { box: "w-10 h-10", text: "text-2xl", char: "text-xl" },
    lg: { box: "w-12 h-12", text: "text-3xl", char: "text-2xl" },
  };

  const variants = {
    default: "bg-black dark:bg-white text-white dark:text-black",
    light: "bg-white text-black",
    dark: "bg-black text-white",
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center font-black rounded-xl shadow-2xl transition-all duration-500",
          sizes[size].box,
          variants[variant]
        )}
      >
        <span className={sizes[size].char}>L</span>
      </motion.div>

      {!collapsed && (
        <span
          className={cn(
            "font-black tracking-tighter uppercase font-sans transition-colors duration-300 group-hover:text-accent",
            sizes[size].text
          )}
        >
          LUXE
          <span className="text-accent group-hover:animate-pulse">.</span>
        </span>
      )}
    </Link>
  );
}
