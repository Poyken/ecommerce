/**
 * =====================================================================
 * ANALYTICS SERVER ACTIONS - Thu thập dữ liệu hiệu năng & hành vi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Server Action này dùng để gửi các chỉ số hiệu năng (Web Vitals)
 * từ trình duyệt về Backend để theo dõi sức khỏe của hệ thống.
 *
 * Tại sao dùng "sendBeacon" hoặc "fetch" trực tiếp?
 * - Trong Next.js, chúng ta có thể dùng Server Action để làm proxy
 *   hoặc gọi trực tiếp API từ client. Ở đây dùng Action để dễ quản lý link API. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Site Reliability Engineering (SRE): Thu thập các chỉ số LCP, CLS, FID từ người dùng thực tế để phát hiện sớm các vấn đề về hiệu năng gây tụt hạng SEO.
 * - Data-Driven Optimization: Giúp đội ngũ Developer biết chính xác trang nào đang tải chậm để ưu tiên tối ưu hóa, đảm bảo trải nghiệm mua sắm luôn mượt mà.

 * =====================================================================
 */

"use server";

import { analyticsService } from "./services/analytics.service";

export async function savePerformanceMetricAction(data: {
  name: string;
  value: number;
  rating: string;
  url: string;
  userAgent?: string;
  navigationType?: string;
}) {
  try {
    await analyticsService.savePerformanceMetric(data);
    return { success: true };
  } catch (error) {
    // Không cần log lỗi rầm rộ vì đây là background task
    return { success: false };
  }
}
