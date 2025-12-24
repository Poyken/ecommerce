"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * =====================================================================
 * USE PAGE TRANSITION HOOK - Hook quản lý page transitions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SMOOTH LOADING STATE:
 * - Cung cấp trạng thái loading cho page transitions.
 * - Giúp hiển thị loading indicator khi chuyển trang.
 *
 * 2. PERFORMANCE:
 * - Sử dụng useTransition để không block UI khi navigating.
 * =====================================================================
 */
export function usePageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  // Track navigation changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const navigate = (callback: () => void) => {
    setIsNavigating(true);
    startTransition(() => {
      callback();
    });
  };

  return {
    isPending: isPending || isNavigating,
    navigate,
    startTransition,
  };
}

/**
 * Hook để detect nếu user đang ở trên mobile
 * Giúp optimize rendering cho mobile users
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    checkMobile();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook để detect reduced motion preference
 * Giúp tôn trọng accessibility settings của user
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
