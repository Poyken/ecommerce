"use server";

import { http } from "@/lib/http";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Review } from "@/types/models";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/server-action-wrapper";

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
  let params: any = {};
  if (
    typeof paramsOrPage === "object" &&
    paramsOrPage !== null &&
    !Array.isArray(paramsOrPage)
  ) {
    params = paramsOrPage;
  } else {
    params = { page: paramsOrPage, limit, search };
  }

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
    revalidatePath("/admin/reviews", "page");
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
    revalidatePath("/admin/reviews", "page");
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
    revalidatePath("/admin/reviews", "page");
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
    revalidatePath("/admin/reviews", "page");
    return res.data;
  }, "Failed to analyze sentiment");
}
