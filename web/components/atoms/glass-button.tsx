"use client";

import { hoverScale, tapScale } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

/**
 * =====================================================================
 * GLASS BUTTON - Nút bấm hiệu ứng kính mờ (Glassmorphism)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FRAMER MOTION INTEGRATION:
 * - Kế thừa `HTMLMotionProps<"button">` để có thể nhận các props animation như `whileHover`, `whileTap`.
 * - Mặc định có hiệu ứng `scale` nhẹ khi hover/click để tăng tính tương tác.
 *
 * 2. GLASSMORPHISM STYLE:
 * - Sử dụng `backdrop-blur-md` kết hợp với nền trắng có độ trong suốt thấp (`bg-white/10`).
 * - Border cũng có độ trong suốt (`border-white/10`) để tạo cảm giác cạnh kính sắc nét.
 *
 * 3. FORWARD REF:
 * - Sử dụng `forwardRef` để các thư viện khác (như Radix UI hoặc Tooltip) có thể truy cập trực tiếp vào DOM element.
 * =====================================================================
 */

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "glass" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 border-transparent font-bold",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-lg font-bold",
      glass:
        "bg-white/10 backdrop-blur-xl border-white/10 text-white hover:bg-white/20 hover:border-white/30 shadow-lg font-bold",
      ghost:
        "bg-transparent text-current hover:bg-foreground/5 border-transparent font-medium",
      outline:
        "bg-transparent border-2 border-foreground/10 hover:bg-foreground/5 hover:border-primary/30 font-bold",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs font-bold uppercase tracking-wider",
      md: "h-11 px-7 py-2.5 text-sm font-bold",
      lg: "h-14 px-10 text-base font-black uppercase tracking-wide",
      icon: "h-11 w-11 p-0 flex items-center justify-center rounded-2xl",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={hoverScale}
        whileTap={tapScale}
        disabled={props.disabled || loading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 border cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children as React.ReactNode}
      </motion.button>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
