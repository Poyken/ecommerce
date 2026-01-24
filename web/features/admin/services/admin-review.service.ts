import { http } from "@/lib/http";
import { normalizePaginationParams, PaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";
import { Review } from "@/types/models";

/**
 * =====================================================================
 * ADMIN REVIEW SERVICE - Domain logic for admin review management
 * =====================================================================
 */

export const adminReviewService = {
  getReviews: async (
    paramsOrPage: number | PaginationParams = {},
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Review[]>>("/reviews", { params });
  },

  deleteReview: async (id: string) => {
    return http.delete(`/reviews/${id}`);
  },

  replyToReview: async (id: string, reply: string) => {
    return http.post<ApiResponse<Review>>(`/reviews/${id}/reply`, { reply });
  },

  updateReviewStatus: async (id: string, isApproved: boolean) => {
    return http.patch<ApiResponse<Review>>(`/reviews/${id}/status`, {
      isApproved,
    });
  },

  analyzeSentiment: async (text: string) => {
    return http.post<
      ApiResponse<{
        sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
        score: number;
      }>
    >("/ai-automation/analyze-review-sentiment", { text });
  },
};
