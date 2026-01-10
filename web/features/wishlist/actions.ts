/**
 * =====================================================================
 * WISHLIST SERVER ACTIONS - Quản lý danh sách yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các actions để quản lý danh sách sản phẩm yêu thích của user.
 * Hệ thống hỗ trợ cả Wishlist cho User đã đăng nhập (lưu DB) và
 * Guest Wishlist (lưu localStorage).
 *
 * CÁC TÍNH NĂNG CHÍNH:
 * 1. Toggle (Thêm/Xóa) sản phẩm khỏi wishlist.
 * 2. Lấy danh sách sản phẩm yêu thích.
 * 3. Kiểm tra trạng thái yêu thích của một sản phẩm.
 * 4. Merge Guest Wishlist vào DB sau khi user đăng nhập.
 *
 * ⚠️ LƯU Ý: Khi user đăng nhập, hệ thống sẽ tự động gọi `mergeGuestWishlistAction`.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { protectedActionClient } from "@/lib/safe-action";
import {
  REVALIDATE,
  wrapServerAction,
  createActionWrapper,
} from "@/lib/safe-action-utils";
import { ApiResponse, ActionResult } from "@/types/api";
import { Product } from "@/types/models";
import { cookies } from "next/headers";
import { z } from "zod";

// --- VALIDATION SCHEMAS ---

const ToggleWishlistSchema = z.object({
  productId: z.string().min(1),
});

const MergeWishlistSchema = z.object({
  productIds: z.array(z.string()),
});

// --- SAFE ACTIONS (Mutations) ---

/**
 * Toggle Wishlist Action (Thêm hoặc xóa)
 */
const safeToggleWishlist = protectedActionClient
  .schema(ToggleWishlistSchema)
  .action(async ({ parsedInput }) => {
    const res = await http<ApiResponse<{ isWishlisted: boolean }>>(
      "/wishlist/toggle",
      {
        method: "POST",
        body: JSON.stringify({ productId: parsedInput.productId }),
        skipRedirectOn401: true,
      }
    );

    // Revalidate related paths
    REVALIDATE.wishlist();
    REVALIDATE.products(parsedInput.productId);

    return { isWishlisted: res.data.isWishlisted };
  });

/**
 * Merge Guest Wishlist Action
 */
const safeMergeGuestWishlist = protectedActionClient
  .schema(MergeWishlistSchema)
  .action(async ({ parsedInput }) => {
    const res = await http<ApiResponse<Product[]>>("/wishlist/merge", {
      method: "POST",
      body: JSON.stringify({ productIds: parsedInput.productIds }),
    });

    REVALIDATE.wishlist();
    return res.data;
  });

// --- EXPORTED ACTIONS ---

/**
 * Helper wrapper cho Toggle Wishlist
 */
export const toggleWishlistAction = async (productId: string) => {
  const wrapper = createActionWrapper(
    safeToggleWishlist,
    "Không thể cập nhật yêu thích"
  );
  const result = await wrapper({ productId });

  // Custom return format để khớp với code cũ (trả về requiresAuth nếu lỗi 401)
  // Tuy nhiên, logic check 401 đã được handle bởi middleware hoặc safeAction
  // Nếu client cần check auth, nên check trước khi gọi action hoặc handle error
  if (
    !result.success &&
    (result.error.includes("Unauthorized") || result.error.includes("login"))
  ) {
    return { success: false, requiresAuth: true, error: "Unauthorized" };
  }

  // Map result.data.isWishlisted ra ngoài
  if (result.success && result.data) {
    return { success: true, isWishlisted: (result.data as any).isWishlisted };
  }

  return result;
};

/**
 * Wrapper cho Merge Guest Wishlist
 */
export const mergeGuestWishlistAction = async (productIds: string[]) => {
  const wrapper = createActionWrapper(
    safeMergeGuestWishlist,
    "Không thể đồng bộ wishlist"
  );
  return wrapper({ productIds });
};

// --- QUERY ACTIONS (Fetch Data) ---

/**
 * Lấy danh sách tất cả sản phẩm trong wishlist của user.
 */
export async function getWishlistAction(): Promise<ActionResult<Product[]>> {
  await cookies();
  return wrapServerAction(
    () =>
      http<ApiResponse<Product[]>>("/wishlist", {
        skipRedirectOn401: true,
      }),
    "Failed to fetch wishlist"
  );
}

/**
 * Kiểm tra xem một sản phẩm có nằm trong wishlist của user không.
 */
export async function checkWishlistStatusAction(
  productId: string
): Promise<ActionResult<{ isWishlisted: boolean }>> {
  await cookies();
  return wrapServerAction(
    () =>
      http<ApiResponse<{ isWishlisted: boolean }>>(
        `/wishlist/check?productId=${productId}`
      ),
    "Failed to check wishlist status"
  );
}

/**
 * Lấy số lượng sản phẩm trong wishlist của user (đã đăng nhập).
 */
export async function getWishlistCountAction(): Promise<
  ActionResult<{ count: number }>
> {
  await cookies();
  return wrapServerAction(
    () => http<ApiResponse<{ count: number }>>("/wishlist/count"),
    "Failed to fetch wishlist count"
  );
}

/**
 * Lấy chi tiết sản phẩm cho Guest Wishlist (dựa trên danh sách IDs).
 */
export async function getGuestWishlistDetailsAction(
  productIds: string[]
): Promise<ActionResult<Product[]>> {
  if (!productIds || productIds.length === 0)
    return { success: true, data: [] };

  return wrapServerAction(
    () =>
      http<ApiResponse<Product[]>>("/products", {
        params: {
          ids: productIds.join(","),
          includeSkus: true,
          limit: 50,
        },
      }),
    "Failed to fetch guest wishlist details"
  );
}
