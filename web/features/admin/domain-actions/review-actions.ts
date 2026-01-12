/**
 * =====================================================================
 * REVIEW ACTIONS - Tương tác với API Đánh giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AI INTEGRATION:
 * - `analyzeReviewSentimentAction`: Gọi AI endpoint để phân tích cảm xúc
 *   (Tích cực, Tiêu cực, Trung tính) dựa trên nội dung text của review.
 * - Giúp Admin lọc nhanh các review tiêu cực để ưu tiên xử lý.
 *
 * 2. MODERATION FLOW:
 * - `updateReviewStatusAction`: Duyệt (Approve) hoặc Ẩn (Hide) review.
 * - Chỉ review đã duyệt mới được hiện ngoài Storefront. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Review } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * REVIEW ACTIONS - Quản lý đánh giá sản phẩm
 * =====================================================================
 */

export async function getReviewsAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Review[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);

  return wrapServerAction(
    () => http<ApiResponse<Review[]>>("/reviews", { params }),
    "Failed to fetch reviews"
  );
}

export async function deleteReviewAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/reviews/${id}`, { method: "DELETE" });
    REVALIDATE.admin.reviews();
  }, "Failed to delete review");
}

export async function replyToReviewAction(
  id: string,
  reply: string
): Promise<ActionResult<Review>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Review>>(`/reviews/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    });
    REVALIDATE.admin.reviews();
    return res.data;
  }, "Failed to reply to review");
}

export async function updateReviewStatusAction(
  id: string,
  isApproved: boolean
): Promise<ActionResult<Review>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Review>>(`/reviews/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    });
    REVALIDATE.admin.reviews();
    return res.data;
  }, "Failed to update review status");
}

export async function analyzeReviewSentimentAction(
  text: string
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>(
      "/ai-automation/analyze-review-sentiment",
      {
        method: "POST",
        body: JSON.stringify({ text }),
      }
    );
    REVALIDATE.admin.reviews();
    return res.data;
  }, "Failed to analyze sentiment");
}
