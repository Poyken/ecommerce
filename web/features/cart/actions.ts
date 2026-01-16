"use server";

import { protectedActionClient } from "@/lib/safe-action";
import {
  createActionWrapper,
  createVoidActionWrapper,
  REVALIDATE,
  wrapServerAction,
} from "@/lib/safe-action";
import { CartItemSchema } from "@/lib/schemas";
import { ApiResponse, ActionResult } from "@/types/api";
import { Sku } from "@/types/models";
import { cookies } from "next/headers";
import { z } from "zod";

/**
 * =====================================================================
 * CART SERVER ACTIONS - Quản lý Giỏ hàng (Server-side)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TYPE-SAFE ACTIONS (`next-safe-action`):
 * - Sử dụng `protectedActionClient` để đảm bảo user đã login.
 * - Input được validate tự động bởi Zod schema.
 *
 * 2. WRAPPER PATTERN (`createActionWrapper`):
 * - Thay vì viết wrapper function thủ công check validation errors/server errors.
 * - Helper `createActionWrapper` tự động unwrap result thành `{ success, data, error }`.
 *
 * 3. REVALIDATION:
 * - Sử dụng `REVALIDATE.cart()` để consistency. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Data Integrity: Đảm bảo khách hàng không thể tự ý sửa giá sản phẩm bằng cách gửi request qua JS Console nhờ cơ chế validate nghiêm ngặt ở phía Server.
 * - User Persistence: Tự động giữ lại các sản phẩm mà khách hàng đã chọn khi họ chuyển đổi từ máy tính (Guest) sang điện thoại (LoggedIn).

 * =====================================================================
 */

// --- 1. DEFINING SCHEMAS (Validation Rules) ---

// Schema cập nhật số lượng
const UpdateCartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1),
});

// Schema xóa item
const RemoveCartItemSchema = z.object({
  itemId: z.string(),
});

// Schema đặt lại đơn hàng cũ
const ReorderSchema = z.object({
  orderId: z.string(),
});

// Schema gộp giỏ hàng
const MergeCartSchema = z.array(CartItemSchema);

import { cartService } from "./services/cart.service";

// --- 2. DEFINING SAFE ACTIONS (Logic) ---

/**
 * Action thêm vào giỏ hàng an toàn.
 */
const safeAddToCart = protectedActionClient
  .schema(CartItemSchema)
  .action(async ({ parsedInput }) => {
    await cartService.addItem(parsedInput.skuId, parsedInput.quantity);
    REVALIDATE.cart();
    return { success: true };
  });

/**
 * Action cập nhật số lượng item.
 */
const safeUpdateCartItem = protectedActionClient
  .schema(UpdateCartItemSchema)
  .action(async ({ parsedInput }) => {
    await cartService.updateQuantity(parsedInput.itemId, parsedInput.quantity);
    REVALIDATE.cart();
    return { success: true };
  });

/**
 * Action xóa item khỏi giỏ.
 */
const safeRemoveFromCart = protectedActionClient
  .schema(RemoveCartItemSchema)
  .action(async ({ parsedInput }) => {
    await cartService.removeItem(parsedInput.itemId);
    REVALIDATE.cart();
    return { success: true };
  });

/**
 * Action xóa toàn bộ giỏ hàng.
 */
const safeClearCart = protectedActionClient.action(async () => {
  await cartService.clearCart();
  REVALIDATE.cart();
  return { success: true };
});

/**
 * Action Re-order (Mua lại đơn hàng cũ).
 */
const safeReorder = protectedActionClient
  .schema(ReorderSchema)
  .action(async ({ parsedInput }) => {
    // B1: Lấy chi tiết đơn hàng cũ
    const orderRes = await cartService.getOrderForReorder(parsedInput.orderId);

    const order = orderRes.data;
    if (!order || !order.items) {
      throw new Error("Order not found or has no items");
    }

    // B2: Thêm từng sản phẩm vào giỏ hàng using cartService
    const promises = order.items.map(
      (item: { skuId: string; quantity: number }) =>
        cartService.addItem(item.skuId, item.quantity)
    );

    // Đợi tất cả request hoàn tất
    await Promise.allSettled(promises);
    REVALIDATE.cart();
    return { success: true };
  });

/**
 * Action gộp giỏ hàng Guest vào User khi đăng nhập.
 */
const safeMergeGuestCart = protectedActionClient
  .schema(MergeCartSchema)
  .action(async ({ parsedInput }) => {
    const res = await cartService.mergeGuestCart(parsedInput);
    REVALIDATE.cart();
    return res;
  });

// --- 3. EXPORT FUNCTIONS (Client Wrappers) ---

export const addToCartAction = createActionWrapper(
  safeAddToCart,
  "Không thể thêm vào giỏ hàng"
);

export const updateCartItemAction = createActionWrapper(
  safeUpdateCartItem,
  "Không thể cập nhật giỏ hàng"
);

export const removeFromCartAction = createActionWrapper(
  safeRemoveFromCart,
  "Không thể xóa sản phẩm"
);

export const clearCartAction = createVoidActionWrapper(
  safeClearCart,
  "Không thể xóa giỏ hàng"
);

export const reorderAction = createActionWrapper(
  safeReorder,
  "Không thể đặt hàng lại"
);

export const mergeGuestCartAction = createActionWrapper(
  safeMergeGuestCart,
  "Không thể đồng bộ giỏ hàng"
);

// --- 4. PUBLIC ACTIONS (Read-only) ---

/**
 * Lấy chi tiết thông tin sản phẩm cho Guest Cart.
 */
export const getGuestCartDetailsAction = async (skuIds: string[]) => {
  return wrapServerAction(
    () => cartService.getGuestCartDetails(skuIds),
    "Không thể lấy thông tin"
  );
};

/**
 * Lấy số lượng item trong giỏ (hiển thị badge trên icon giỏ hàng).
 */
export async function getCartCountAction(): Promise<
  ActionResult<{ totalItems: number }>
> {
  await cookies();
  return wrapServerAction(async () => {
    const totalItems = await cartService.getCartCount();
    return { totalItems };
  }, "Không thể lấy số lượng giỏ hàng");
}
