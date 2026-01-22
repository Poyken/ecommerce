

"use server";

import { protectedActionClient } from "@/lib/safe-action";
import {
  REVALIDATE,
  wrapServerAction,
  createActionWrapper,
} from "@/lib/safe-action";
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

import { wishlistService } from "./services/wishlist.service";

// --- SAFE ACTIONS (Mutations) ---

/**
 * Toggle Wishlist Action (Thêm hoặc xóa)
 */
const safeToggleWishlist = protectedActionClient
  .schema(ToggleWishlistSchema)
  .action(async ({ parsedInput }) => {
    const res = await wishlistService.toggleWishlist(parsedInput.productId);

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
    const res = await wishlistService.mergeGuestWishlist(
      parsedInput.productIds
    );

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

  if (
    !result.success &&
    (result.error.includes("Unauthorized") || result.error.includes("login"))
  ) {
    return { success: false, requiresAuth: true, error: "Unauthorized" };
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
    () => wishlistService.getWishlist(),
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
    () => wishlistService.checkWishlistStatus(productId),
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
    () => wishlistService.getWishlistCount(),
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
    () => wishlistService.getGuestWishlistDetails(productIds),
    "Failed to fetch guest wishlist details"
  );
}
