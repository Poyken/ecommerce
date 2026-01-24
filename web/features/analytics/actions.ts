

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
