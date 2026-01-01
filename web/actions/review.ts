/**
 * =====================================================================
 * REVIEW SERVER ACTIONS - Quản lý đánh giá sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ELIGIBILITY CHECK (Kiểm tra quyền đánh giá):
 * - Không phải user nào cũng được đánh giá. Phải mua hàng (có đơn hàng DELIVERED) mới được phép.
 * - `checkReviewEligibilityAction` gọi API kiểm tra điều này trước khi hiển thị Form.
 *
 * 2. REVALIDATION:
 * - Sau khi tạo đánh giá `createReviewAction`, ta gọi `revalidatePath`.
 * - Điều này giúp trang sản phẩm hiển thị ngay review mới mà không cần cache cũ hết hạn.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { ReviewSchema, UpdateReviewSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Dữ liệu để tạo review mới.
 */
interface CreateReviewData {
  /** ID sản phẩm */
  productId: string;
  /** ID SKU cụ thể (optional - nếu muốn review biến thể cụ thể) */
  skuId?: string;
  /** Điểm đánh giá (1-5) */
  rating: number;
  /** Nội dung đánh giá */
  content: string;
  /** Danh sách ảnh (URLs) */
  images?: string[];
}

/**
 * Dữ liệu để cập nhật review.
 */
interface UpdateReviewData {
  rating: number;
  content: string;
  images?: string[];
}

/**
 * Kết quả kiểm tra quyền đánh giá.
 */
interface ReviewEligibility {
  /** true nếu user có quyền đánh giá sản phẩm này */
  canReview: boolean;
  /** Danh sách SKU đã mua (để user chọn review SKU nào) */
  purchasedSkus: Array<{
    skuId: string;
    skuCode: string;
  }>;
}

// =============================================================================
// 📝 SERVER ACTIONS - Các hành động xử lý đánh giá
// =============================================================================

/**
 * Tạo đánh giá mới cho sản phẩm.
 *
 * @param data - Thông tin đánh giá (productId, rating, content, skuId?)
 * @returns { success: true } hoặc { success: false, error: string }
 *
 * @example
 * const result = await createReviewAction({
 *   productId: "abc123",
 *   rating: 5,
 *   content: "Sản phẩm rất tốt!"
 * });
 */
export async function createReviewAction(data: CreateReviewData) {
  const parsed = ReviewSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid review data",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await http("/reviews", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    // Revalidate trang sản phẩm để hiển thị review mới
    revalidatePath(`/products/${data.productId}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể gửi đánh giá",
    };
  }
}

/**
 * Cập nhật đánh giá đã tồn tại.
 *
 * @param reviewId - ID của review cần cập nhật
 * @param data - Dữ liệu mới (rating, content)
 * @returns { success: true } hoặc { success: false, error: string }
 *
 * ⚠️ LƯU Ý: User chỉ có thể sửa review của chính mình.
 */
export async function updateReviewAction(
  reviewId: string,
  data: UpdateReviewData
) {
  const parsed = UpdateReviewSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid review data",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await http(`/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Không thể cập nhật đánh giá",
    };
  }
}

/**
 * Kiểm tra xem user có đủ điều kiện đánh giá sản phẩm không.
 *
 * LOGIC:
 * 1. Kiểm tra user đã đăng nhập chưa
 * 2. API kiểm tra user có order DELIVERED chứa sản phẩm này không
 * 3. Trả về danh sách SKU đã mua để user chọn review
 *
 * @param productId - ID sản phẩm cần kiểm tra
 * @returns { success, data: { canReview, purchasedSkus } }
 *
 * @example
 * // Trong component
 * const result = await checkReviewEligibilityAction(productId);
 * if (result.data?.canReview) {
 *   // Hiển thị form đánh giá
 * }
 */
export async function checkReviewEligibilityAction(productId: string) {
  try {
    // Kiểm tra user đã đăng nhập chưa
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      // Guest user không thể đánh giá
      return { success: true, data: { canReview: false, purchasedSkus: [] } };
    }

    // Gọi API kiểm tra eligibility
    const url = `/reviews/check-eligibility?productId=${productId}`;
    const res = await http<{
      data: ReviewEligibility;
    }>(url, {
      cache: "no-store", // Luôn lấy dữ liệu mới nhất
    });

    return { success: true, data: res.data };
  } catch (error: unknown) {
    // Log chi tiết lỗi để debug
    console.error("checkReviewEligibilityAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Không thể kiểm tra quyền",
    };
  }
}

/**
 * Lấy danh sách đánh giá của sản phẩm (có phân trang).
 *
 * @param productId - ID sản phẩm
 * @param page - Số trang (mặc định = 1)
 * @returns { success, data: { data: Review[], meta: PaginationMeta } }
 *
 * @example
 * // Load trang đầu tiên
 * const reviews = await getReviewsAction(productId);
 *
 * // Load trang tiếp theo
 * const moreReviews = await getReviewsAction(productId, 2);
 */
export async function getReviewsAction(productId: string, page = 1) {
  try {
    const res = await http<{ data: unknown[]; meta: unknown }>(
      `/reviews/product/${productId}?page=${page}`
    );
    return { success: true, data: res };
  } catch {
    return { success: false, error: "Không thể tải đánh giá" };
  }
}

/**
 * Xóa đánh giá của mình.
 *
 * @param reviewId - ID của review cần xóa
 * @returns { success: true } hoặc { success: false, error: string }
 *
 * ⚠️ LƯU Ý: API endpoint /reviews/mine/{id} đảm bảo
 * user chỉ xóa được review của chính mình.
 */
export async function deleteReviewAction(reviewId: string) {
  try {
    await http(`/reviews/mine/${reviewId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa đánh giá",
    };
  }
}
