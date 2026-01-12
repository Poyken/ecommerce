"use client";

import { ReactNode, memo, useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * LAZY LOAD COMPONENTS - Components với Intersection Observer
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INTERSECTION OBSERVER:
 * - API browser để detect khi element xuất hiện trong viewport.
 * - Giúp lazy load content chỉ khi user scroll đến.
 *
 * 2. PERFORMANCE BENEFITS:
 * - Giảm initial render cost.
 * - Giảm memory usage.
 * - Cải thiện FCP và LCP metrics. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface LazyLoadProps {
  children: ReactNode;
  /** Fallback content khi chưa visible */
  fallback?: ReactNode;
  /** Root margin cho intersection observer (e.g., "100px") */
  rootMargin?: string;
  /** Threshold khi nào consider visible (0-1) */
  threshold?: number;
  /** CSS class cho container */
  className?: string;
  /** Only load once - không unload khi scroll away */
  once?: boolean;
}

/**
 * LazyLoad component - Chỉ render children khi visible trong viewport
 */
export const LazyLoad = memo(function LazyLoad({
  children,
  fallback = null,
  rootMargin = "100px",
  threshold = 0.1,
  className,
  once = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, once]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
});

/**
 * Hook để detect visibility của một element
 */
export function useInView(options?: {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}) {
  const { rootMargin = "0px", threshold = 0, once = true } = options || {};
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already viewed and once mode
    if (once && hasBeenInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);

        if (visible) {
          setHasBeenInView(true);
          if (once) {
            observer.disconnect();
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, once, hasBeenInView]);

  return { ref, isInView, hasBeenInView };
}

/**
 * FadeInWhenVisible - Element với fade animation khi visible
 */
export const FadeInWhenVisible = memo(function FadeInWhenVisible({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView({ rootMargin: "50px", once: true });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
});
