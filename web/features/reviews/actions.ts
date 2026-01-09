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
 * - Rating từ 1-5 sao
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { protectedActionClient } from "@/lib/safe-action";
import { createActionWrapper, REVALIDATE } from "@/lib/safe-action-utils";
import { ReviewSchema, UpdateReviewSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { Review } from "@/types/models";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Dữ liệu để tạo review mới.
 * (This interface is kept for backward compatibility with existing usages if any,
 * though we prefer using z.infer<typeof ReviewSchema>)
 */
interface CreateReviewData {
  productId: string;
  skuId?: string;
  rating: number;
  content: string;
  images?: string[];
}

interface UpdateReviewData {
  rating: number;
  content: string;
  images?: string[];
}

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
 * (Read-only action, less sensitive but still good to verify auth)
 */
export async function checkReviewEligibilityAction(productId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return { success: true, data: { canReview: false, purchasedSkus: [] } };
    }

    const url = `/reviews/check-eligibility?productId=${productId}`;
    const res = await http<ApiResponse<ReviewEligibility>>(url, {
      cache: "no-store",
    });

    return { success: true, data: res.data };
  } catch (error: unknown) {
    console.error("checkReviewEligibilityAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Không thể kiểm tra quyền",
    };
  }
}

/**
 * Lấy danh sách đánh giá của sản phẩm (Supports Cursor Pagination).
 */
export async function getReviewsAction(productId: string, cursor?: string) {
  try {
    const url = cursor
      ? `/reviews/product/${productId}?cursor=${cursor}&limit=5`
      : `/reviews/product/${productId}?limit=5`;

    const res = await http<ApiResponse<Review[]>>(url, {
      next: { tags: [`reviews:${productId}`] }, // Add Cache Tag for P1
    });
    return { success: true, data: res.data, meta: res.meta };
  } catch {
    return { success: false, error: "Không thể tải đánh giá" };
  }
}

/**
 * Upload ảnh cho đánh giá.
 * Form Data proxy action.
 */
export async function uploadReviewImagesAction(formData: FormData) {
  try {
    const res = await http<{ urls: string[] }>("/reviews/upload", {
      method: "POST",
      body: formData,
    });
    return { urls: res.urls, success: true };
  } catch (error: unknown) {
    console.error("uploadReviewImagesAction error:", error);
    return { error: (error as Error).message, success: false };
  }
}
