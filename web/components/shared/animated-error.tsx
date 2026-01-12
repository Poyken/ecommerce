"use client";

import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";

/**
 * =====================================================================
 * ANIMATED ERROR MESSAGE - Component hiển thị lỗi với animation
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSABLE ERROR UI:
 * - Tách component hiển thị lỗi ra riêng để tái sử dụng trong nhiều form.
 * - Đảm bảo tất cả các form có trải nghiệm animation nhất quán. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface AnimatedErrorProps {
  message?: string;
  className?: string;
}

export function AnimatedError({ message, className = "" }: AnimatedErrorProps) {
  return (
    <AnimatePresence>
      {message && (
        <m.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`text-xs text-destructive ${className}`}
        >
          {message}
        </m.p>
      )}
    </AnimatePresence>
  );
}
