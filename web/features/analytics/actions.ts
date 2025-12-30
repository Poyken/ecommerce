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
 *   hoặc gọi trực tiếp API từ client. Ở đây dùng Action để dễ quản lý link API.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";

export async function savePerformanceMetricAction(data: {
  name: string;
  value: number;
  rating: string;
  url: string;
  userAgent?: string;
  navigationType?: string;
}) {
  try {
    await http("/analytics/performance", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true, // Cho phép khách gửi telemetry để đo LCP/CLS thực tế
    });
    return { success: true };
  } catch (error) {
    // Không cần log lỗi rầm rộ vì đây là background task
    return { success: false };
  }
}
