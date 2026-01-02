"use client";

import { ReactNode } from "react";

interface HomeWrapperProps {
  children: ReactNode;
}

/**
 * =====================================================================
 * HOME WRAPPER - Setup nền tảng cho Homepage
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FIXED BACKGROUND ELEMENTS:
 * - Các `div` background (blur blobs) được đặt `fixed`.
 * - Chúng sẽ đứng yên khi user scroll nội dung trang, tạo hiệu ứng chiều sâu (Parallax giả).
 * - `pointer-events-none`: Đảm bảo không chặn click của user vào các nội dung bên dưới.
 * =====================================================================
 */
export function HomeWrapper({ children }: HomeWrapperProps) {
  // Use translations if needed for aria-labels, but mostly for background

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30 relative overflow-hidden">
      {/* Subtle Background Elements from HomeContent */}
      <div data-fixed-element className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-3/4 h-[40vh] bg-accent/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-1/2 h-[30vh] bg-secondary/30 rounded-full blur-[150px]" />
      </div>

      {children}
    </div>
  );
}
