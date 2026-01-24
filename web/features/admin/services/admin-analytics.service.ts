import { http } from "@/lib/http";
import {
  AnalyticsStats,
  ApiResponse,
  SalesDataPoint,
  TopProduct,
} from "@/types/dtos";

/**
 * =====================================================================
 * ADMIN ANALYTICS SERVICE - Domain logic for analytics & dashboard
 * =====================================================================
 */

export const adminAnalyticsService = {
  getStats: async () => {
    return http.get<ApiResponse<AnalyticsStats>>("/admin/analytics/dashboard");
  },

  getSalesData: async (range: string) => {
    return http.get<ApiResponse<SalesDataPoint[]>>(
      `/admin/analytics/revenue-chart?days=${range}`
    );
  },

  getTopProducts: async () => {
    return http.get<ApiResponse<TopProduct[]>>("/admin/analytics/top-products");
  },

  getBlogStats: async () => {
    return http.get<
      ApiResponse<{ totalPosts: number; totalViews: number; avgReadTime: number }>
    >("/blog/stats");
  },
};
