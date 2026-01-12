/**
 * =====================================================================
 * REVIEW SERVER ACTIONS - Quản lý đánh giá sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các Server Actions cho chức năng đánh giá sản phẩm:
 * - Tạo đánh giá mới
 * - Cập nhật đánh giá
 * - Xóa đánh giá của mình
 * - Kiểm tra quyền đánh giá (user phải đã mua sản phẩm)
 * - Lấy danh sách đánh giá của sản phẩm
 *
 * QUY TẮC NGHIỆP VỤ:
 * - Chỉ user đã mua sản phẩm mới được đánh giá
 * - Mỗi user chỉ được đánh giá 1 lần cho mỗi SKU đã mua
 * - Rating từ 1-5 sao *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Social Proof: Xây dựng lòng tin cho khách hàng bằng cách cho phép những người đã mua sản phẩm chia sẻ hình ảnh và đánh giá thực tế.
 * - Data Integrity: Ngăn chặn việc đánh giá ảo (spam) bằng cách chỉ cho phép những user đã mua đúng mã sản phẩm (SKU) đó mới được để lại bình luận.

 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
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

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================
export interface ReviewEligibility {
  canReview: boolean;
  purchasedSkus: Array<{
    skuId: string;
    skuCode: string;
  }>;
}

// =============================================================================
// 🔒 SAFE ACTIONS (INTERNAL)
// =============================================================================

const safeCreateReview = protectedActionClient
  .schema(ReviewSchema)
  .action(async ({ parsedInput: data }) => {
    await http("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
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
    await http(`/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return { success: true };
  });

const DeleteReviewSchema = z.object({ reviewId: z.string() });

const safeDeleteReview = protectedActionClient
  .schema(DeleteReviewSchema)
  .action(async ({ parsedInput: { reviewId } }) => {
    await http(`/reviews/mine/${reviewId}`, {
      method: "DELETE",
    });
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
    () =>
      http<ApiResponse<ReviewEligibility>>(
        `/reviews/check-eligibility?productId=${productId}`,
        { cache: "no-store" }
      ),
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
  const url = cursor
    ? `/reviews/product/${productId}?cursor=${cursor}&limit=5`
    : `/reviews/product/${productId}?limit=5`;

  return wrapServerAction(
    () =>
      http<ApiResponse<Review[]>>(url, {
        next: { tags: [`reviews:${productId}`] },
      }),
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
    () =>
      http<{ urls: string[] }>("/reviews/upload", {
        method: "POST",
        body: formData,
      }),
    "Failed to upload images"
  );
}
