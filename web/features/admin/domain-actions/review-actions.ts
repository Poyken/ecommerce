
"use server";

import { adminReviewService } from "../services/admin-review.service";
import { ActionResult } from "@/types/dtos";
import { Review } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { PaginationParams } from "@/lib/utils";

/**
 * =====================================================================
 * REVIEW ACTIONS - Quản lý đánh giá sản phẩm
 * =====================================================================
 */

export async function getReviewsAction(
  paramsOrPage: number | PaginationParams = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Review[]>> {
  return wrapServerAction(
    () => adminReviewService.getReviews(paramsOrPage, limit, search),
    "Failed to fetch reviews"
  );
}

export async function deleteReviewAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminReviewService.deleteReview(id);
    REVALIDATE.admin.reviews();
  }, "Failed to delete review");
}

export async function replyToReviewAction(
  id: string,
  reply: string
): Promise<ActionResult<Review>> {
  return wrapServerAction(async () => {
    const res = await adminReviewService.replyToReview(id, reply);
    REVALIDATE.admin.reviews();
    return res.data;
  }, "Failed to reply to review");
}

export async function updateReviewStatusAction(
  id: string,
  isApproved: boolean
): Promise<ActionResult<Review>> {
  return wrapServerAction(async () => {
    const res = await adminReviewService.updateReviewStatus(id, isApproved);
    REVALIDATE.admin.reviews();
    return res.data;
  }, "Failed to update review status");
}

export async function analyzeReviewSentimentAction(
  text: string
): Promise<
  ActionResult<{
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    score: number;
  }>
> {
  return wrapServerAction(async () => {
    const res = await adminReviewService.analyzeSentiment(text);
    REVALIDATE.admin.reviews();
    return res.data;
  }, "Failed to analyze sentiment");
}
