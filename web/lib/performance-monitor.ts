/**
 * =====================================================================
 * PERFORMANCE MONITOR - Theo dõi Web Vitals & Hiệu năng thực tế
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-USER MONITORING (RUM):
 * - Thay vì chỉ test bằng Lighthouse (Lab data), ta cần biết người dùng thật trải nghiệm thế nào.
 * - Utility này sử dụng các API trình duyệt (PerformanceObserver) để đo đạc.
 *
 * 2. WEB VITALS METRICS:
 * - LCP (Largest Contentful Paint): Tốc độ load ảnh/text lớn nhất.
 * - CLS (Cumulative Layout Shift): Độ ổn định của bố cục (không bị nhảy).
 * - FID (First Input Delay): Tốc độ phản hồi khi click.
 *
 * 3. REPORTING:
 * - Trong môi trường Production, dữ liệu được gửi về server (hoặc logging service)
 *   để team có thể tối ưu các trang bị chậm.
 * =====================================================================
 */

"use client";

import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const VITALS_URL = "/api/v1/analytics/vitals"; // M giả định có endpoint này

type Metric = {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType: string;
};

export const initPerformanceMonitor = () => {
  if (typeof window === "undefined") return;

  const reportValue = (metric: any) => {
    const { name, value, id, rating, navigationType } = metric;

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}:`, {
        value: Math.round(value * 100) / 100,
        rating,
        id,
      });
      return;
    }

    // Send to analytics endpoint in production
    // Using sendBeacon for reliable delivery during page unload
    const body = JSON.stringify({
      name,
      value,
      id,
      rating,
      navigationType,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(VITALS_URL, blob);
    } else {
      fetch(VITALS_URL, {
        body,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
      }).catch(() => {});
    }
  };

  try {
    onCLS(reportValue);
    onINP(reportValue);
    onLCP(reportValue);
    onFCP(reportValue);
    onTTFB(reportValue);
  } catch (err) {
    console.error("[PerformanceMonitor] Error initializing:", err);
  }
};
