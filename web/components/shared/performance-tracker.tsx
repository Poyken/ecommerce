"use client";

import { initPerformanceMonitor } from "@/lib/performance-monitor";
import { useEffect } from "react";

export function PerformanceTracker() {
/**
 * =====================================================================
 * PERFORMANCE TRACKER - Theo dõi Web Vitals
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEB VITALS MONITORING:
 * - Gọi `initPerformanceMonitor()` (sử dụng thư viện `web-vitals` của Google).
 * - Log các chỉ số LCP, CLS, FID ra console hoặc gửi về Analytics Server.
 * - Chỉ chạy 1 lần khi mount (`useEffect` empty deps).
 * =====================================================================
 */
  useEffect(() => {
    initPerformanceMonitor();
  }, []);

  return null;
}
