"use client";

import { m } from "@/lib/animations";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * LOADING SCREEN - Hiệu ứng chờ tinh tế (Elegant Loading)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLEAN AESTHETICS:
 * - Quay lại phong cách tối giản, tập trung vào sự tinh tế thay vì quá nhiều chi tiết.
 * - Sử dụng Backdrop Blur nhẹ nhàng để giữ sự tập trung.
 *
 * 2. UNIQUE CIRCLE ANIMATION:
 * - Thay vì vòng xoay đơn điệu, ta sử dụng 2 vòng tròn lồng nhau với hiệu ứng "Orbit" (Quỹ đạo).
 * - Kết hợp với hiệu ứng Pulse ở tâm để tạo cảm giác "sống". *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).
 *
 * =====================================================================
 */

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
  variant?: "classic" | "luxury" | "minimal" | "creative";
  size?: "sm" | "md" | "lg";
}

export function LoadingScreen({
  message,
  fullScreen = true,
  className,
  variant = "classic",
  size = "md",
}: LoadingScreenProps) {
  const t = useTranslations("loading");
  const displayMessage = message || t("message");

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-40 h-40",
  };

  const renderAnimation = () => {
    switch (variant) {
      case "luxury":
        return (
          <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-primary/20 dark:border-primary/20"
            />
            <m.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-foreground/30 border-dashed"
            />
            <m.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-1/3 h-1/3 bg-primary rounded-lg shadow-lg shadow-primary/20"
            />
          </div>
        );
      case "minimal":
        return (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <m.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-8 bg-primary rounded-full"
              />
            ))}
          </div>
        );
      case "creative":
        return (
          <div className={cn("relative", sizeClasses[size])}>
            <m.div
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 180, 360],
                borderRadius: ["20%", "50%", "20%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-full h-full border-4 border-primary/30 flex items-center justify-center"
            >
              <m.div
                animate={{ scale: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-4 h-4 bg-accent rounded-full"
              />
            </m.div>
          </div>
        );
      default:
        return (
          <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
            <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary/40"
            />
            <m.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border-b-2 border-l-2 border-accent/40"
            />
            <m.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/40"
            />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center transition-all duration-500",
        fullScreen
          ? "fixed inset-0 z-100 bg-background/80 backdrop-blur-xl"
          : "w-full min-h-[60vh] bg-transparent",
        className
      )}
    >
      {renderAnimation()}

      {/* Text Content */}
      <div className="mt-12 flex flex-col items-center gap-3">
        {variant !== "minimal" && (
          <m.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-[0.4em] text-foreground uppercase"
          >
            Luxe
          </m.h2>
        )}

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-sm font-medium text-muted-foreground/70 italic">
            {displayMessage}
          </span>
          <span className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
          </span>
        </m.div>
      </div>
    </div>
  );
}
