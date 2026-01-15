/**
 * =====================================================================
 * STICKY HEADER - Hiệu ứng Header dính và đổi màu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SCROLL DETECTION:
 * - Sử dụng `window.scrollY` để phát hiện khi người dùng cuộn trang xuống quá 100px.
 * - Thay đổi style của Header (thêm shadow, đổi màu nền) để giữ cho menu luôn hiển thị mà không gây rối mắt.
 *
 * 2. CONDITIONAL STYLING:
 * - Header có hành vi khác nhau giữa Trang chủ (trong suốt ban đầu) và các trang con (luôn có nền). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * STICKY HEADER - Hiệu ứng Header dính và đổi màu
 * =====================================================================
 */

interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
  isInline?: boolean;
}

export function StickyHeader({
  children,
  className,
  isInline = false,
}: StickyHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [enableAnimation, setEnableAnimation] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    // Initial check
    handleScroll();

    // After the initial check and first render, we allow animations
    const timer = setTimeout(() => {
      setEnableAnimation(true);
    }, 200);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <header
      data-fixed-element
      className={cn(
        "w-full z-50 transition-[background-color,border-color,transform,box-shadow,backdrop-filter] duration-300 ease-in-out",
        // Base positioning
        !isInline
          ? isHome
            ? isScrolled
              ? "fixed top-0 left-0 right-0 shadow-md bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-white/10"
              : "absolute top-0 left-0 right-0 border-transparent bg-transparent"
            : "fixed top-0 left-0 right-0 border-b border-white/10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
          : "relative border-b shadow-sm bg-background",
        // Animation
        !isInline &&
          isScrolled &&
          isHome &&
          enableAnimation &&
          "animate-in slide-in-from-top-full",
        className
      )}
    >
      {children}
    </header>
  );
}
