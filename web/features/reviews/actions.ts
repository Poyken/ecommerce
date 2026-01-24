

"use server";

import { protectedActionClient } from "@/lib/safe-action";
import {
  REVALIDATE,
  wrapServerAction,
  createActionWrapper,
} from "@/lib/safe-action";
import { ReviewSchema, UpdateReviewSchema } from "@/lib/schemas";
import { ApiResponse, ActionResult } from "@/types/api";
import { Review } from "@/types/models";
import { cookies } from "next/headers";
import { z } from "zod";

import { reviewService } from "./services/review.service";
import { ReviewEligibility } from "@/types/models";

// =============================================================================
// 🔒 SAFE ACTIONS (INTERNAL)
// =============================================================================

const safeCreateReview = protectedActionClient
  .schema(ReviewSchema)
  .action(async ({ parsedInput: data }) => {
    await reviewService.createReview(data);
    REVALIDATE.products(data.productId);
    return { success: true };
  });

/* 
   Note: We need a schema for Updating that includes the reviewId 
   since next-safe-action usually takes one input object.
   However, UpdateReviewSchema only has the body.
   We will create a combined schema for the internal action.
*/
const UpdateReviewWithIdSchema = UpdateReviewSchema.extend({
  reviewId: z.string(),
});

const safeUpdateReview = protectedActionClient
  .schema(UpdateReviewWithIdSchema)
  .action(async ({ parsedInput: { reviewId, ...data } }) => {
    await reviewService.updateReview(reviewId, data);
    return { success: true };
  });

const DeleteReviewSchema = z.object({ reviewId: z.string() });

const safeDeleteReview = protectedActionClient
  .schema(DeleteReviewSchema)
  .action(async ({ parsedInput: { reviewId } }) => {
    await reviewService.deleteReview(reviewId);
    return { success: true };
  });

// =============================================================================
// 📝 SERVER ACTIONS (PUBLIC EXPORTS)
// =============================================================================

/**
 * Tạo đánh giá mới cho sản phẩm.
 * Uses CSRF-protected safe action internally.
 */
export const createReviewAction = createActionWrapper(
  safeCreateReview,
  "Validation Error"
);

/**
 * Cập nhật đánh giá đã tồn tại.
 */
export const updateReviewAction = createActionWrapper(
  safeUpdateReview,
  "Failed to update review"
);

/**
 * Xóa đánh giá của mình.
 */
export const deleteReviewAction = createActionWrapper(
  safeDeleteReview,
  "Failed to delete review"
);

/**
 * Kiểm tra xem user có đủ điều kiện đánh giá sản phẩm không.
 */
export async function checkReviewEligibilityAction(
  productId: string
): Promise<ActionResult<ReviewEligibility>> {
  await cookies();
  return wrapServerAction(
    () => reviewService.checkEligibility(productId),
    "Không thể kiểm tra quyền đánh giá"
  );
}

/**
 * Lấy danh sách đánh giá của sản phẩm (Supports Cursor Pagination).
 */
export async function getReviewsAction(
  productId: string,
  cursor?: string
): Promise<ActionResult<Review[]>> {
  return wrapServerAction(
    () => reviewService.getReviews(productId, cursor),
    "Không thể tải đánh giá"
  );
}

/**
 * Upload ảnh cho đánh giá.
 * Form Data proxy action.
 */
export async function uploadReviewImagesAction(
  formData: FormData
): Promise<ActionResult<{ urls: string[] }>> {
  return wrapServerAction(
    () => reviewService.uploadImages(formData),
    "Failed to upload images"
  );
}
