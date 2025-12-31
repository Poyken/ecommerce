/**
 * =====================================================================
 * WEB VITALS MONITORING - Theo dõi chỉ số trải nghiệm người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEB VITALS LÀ GÌ?
 * - Là tập hợp các chỉ số quan trọng mà Google dùng để đánh giá chất lượng trải nghiệm trang (UX).
 * - Điểm Web Vitals cao giúp cải thiện thứ hạng SEO.
 *
 * 2. CÁC CHỈ SỐ CHÍNH:
 * - LCP (Largest Contentful Paint): Thời gian load thành phần lớn nhất.
 * - CLS (Cumulative Layout Shift): Sự ổn định của bố cục (không bị giật khi load).
 * - FID (First Input Delay): Thời gian phản hồi lần tương tác đầu tiên.
 *
 * 3. REPORTING:
 * - File này tự động gửi kết quả đo đạc về Server và Google Analytics.
 * - Giúp chúng ta biết trang nào đang bị chậm trong thực tế để tối ưu.
 * =====================================================================
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface Metric {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: "web-vital" | "custom";
  delta: number;
}

import { savePerformanceMetricAction } from "@/features/analytics/actions";

export function reportWebVitals(metric: Metric) {
  // Log ra console trong môi trường phát triển để dễ theo dõi dể tối ưu
  if (process.env.NODE_ENV === "development") {
    console.log("[Web Vitals]", metric);
  }

  // Chuyển đổi giá trị đo được thành đánh giá (rating) dựa trên ngưỡng chuẩn của Google
  let rating = "good";
  if (metric.name === "CLS") {
    if (metric.value > 0.25) rating = "poor";
    else if (metric.value > 0.1) rating = "needs-improvement";
  } else if (metric.name === "LCP") {
    if (metric.value > 4000) rating = "poor";
    else if (metric.value > 2500) rating = "needs-improvement";
  } else if (metric.name === "FID") {
    if (metric.value > 300) rating = "poor";
    else if (metric.value > 100) rating = "needs-improvement";
  }

  savePerformanceMetricAction({
    name: metric.name,
    value: metric.value,
    rating,
    url:
      typeof window !== "undefined" ? window.location.href : "không xác định",
  });

  // Gửi dữ liệu cho Google Analytics nếu có cấu hình
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}
