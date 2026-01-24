import { http } from "@/lib/http";
import { ApiResponse } from "@/types/api";

export interface Insight {
  type: "warning" | "success" | "info";
  title: string;
  message: string;
  action?: string;
}

export interface DailyInsights {
  insights: Insight[];
  summary: string;
  generatedAt: string;
}

export const adminInsightsService = {
  /**
   * Get daily business insights (AI powered)
   */
  getInsights: async () => {
    return http.get<ApiResponse<DailyInsights>>("/insights", {
      skipRedirectOn401: true,
    });
  },

  /**
   * Force refresh AI insights
   */
  refreshInsights: async () => {
    return http.post<ApiResponse<DailyInsights>>("/insights/refresh", {});
  },
};
