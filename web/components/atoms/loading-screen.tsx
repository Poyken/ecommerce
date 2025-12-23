"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

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
 * - Kết hợp với hiệu ứng Pulse ở tâm để tạo cảm giác "sống".
 * =====================================================================
 */

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message,
  fullScreen = true,
}: LoadingScreenProps) {
  const t = useTranslations("loading");
  const displayMessage = message || t("message");

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen
          ? "fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl"
          : "w-full py-20 bg-transparent"
      }`}
    >
      <div className="relative">
        {/* Outer Glow - Subtle */}
        <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse" />

        {/* Main Animation Container */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer Orbiting Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary/40"
          />

          {/* Inner Orbiting Ring (Faster & Reverse) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border-b-2 border-l-2 border-accent/40"
          />

          {/* Center Pulsing Core */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]"
          />

          {/* Floating Particles around the core */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          </motion.div>
        </div>
      </div>

      {/* Text Content */}
      <div className="mt-12 flex flex-col items-center gap-3">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-[0.4em] text-foreground uppercase"
        >
          Luxe
        </motion.h2>

        <motion.div
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
        </motion.div>
      </div>
    </div>
  );
}
