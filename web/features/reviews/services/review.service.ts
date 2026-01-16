import { http } from "@/lib/http";
import { Review, ReviewEligibility } from "@/types/models";
import { ApiResponse } from "@/types/api";

/**
 * =====================================================================
 * REVIEW SERVICE - Domain logic for product reviews
 * =====================================================================
 */

export interface CreateReviewDto {
  productId: string;
  skuId?: string;
  rating: number;
  content: string;
  images?: string[];
}

export interface UpdateReviewDto {
  rating?: number;
  content?: string;
  images?: string[];
}

export const reviewService = {
  createReview: async (data: CreateReviewDto) => {
    return http.post("/reviews", data);
  },

  updateReview: async (reviewId: string, data: UpdateReviewDto) => {
    return http.patch(`/reviews/${reviewId}`, data);
  },

  deleteReview: async (reviewId: string) => {
    return http.delete(`/reviews/mine/${reviewId}`);
  },

  checkEligibility: async (productId: string) => {
    return http.get<ApiResponse<ReviewEligibility>>(
      `/reviews/check-eligibility?productId=${productId}`,
      { cache: "no-store" }
    );
  },

  getReviews: async (productId: string, cursor?: string) => {
    const url = cursor
      ? `/reviews/product/${productId}?cursor=${cursor}&limit=5`
      : `/reviews/product/${productId}?limit=5`;

    return http.get<ApiResponse<Review[]>>(url, {
      next: { tags: [`reviews:${productId}`] },
    });
  },

  uploadImages: async (formData: FormData) => {
    return http.post<{ urls: string[] }>("/reviews/upload", formData);
  },
};
