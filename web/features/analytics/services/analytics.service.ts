import { http } from "@/lib/http";

/**
 * =====================================================================
 * ANALYTICS SERVICE - Domain logic for analytics
 * =====================================================================
 */

export const analyticsService = {
  savePerformanceMetric: async (data: {
    name: string;
    value: number;
    rating: string;
    url: string;
    userAgent?: string;
    navigationType?: string;
  }) => {
    return http.post("/analytics/vitals", data, { skipAuth: true });
  },
};
