import { http } from "@/lib/http";
import { ApiResponse, SuperAdminAnalyticsStats } from "@/types/dtos";

/**
 * =====================================================================
 * SUPER ADMIN ANALYTICS SERVICE - Domain logic for platform analytics
 * =====================================================================
 */

export const superAdminAnalyticsService = {
  getPlatformStats: async () => {
    return http.get<ApiResponse<SuperAdminAnalyticsStats>>("/platform/stats");
  },
};
