"use server";

import { http } from "@/lib/http";
import { protectedActionClient } from "@/lib/safe-action";
import { CartItemSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { Sku } from "@/types/models";
import { revalidatePath } from "next/cache";
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
 * - Thay vì viết tay try-catch và validate Zod thủ công trong mọi hàm.
 * - Thư viện này tự động validate input đầu vào `schema(CartItemSchema)` -> Nếu sai type, nó chặn ngay lập tức.
 *
 * 2. CACHE INVALIDATION (`revalidatePath`):
 * - Next.js cache dữ liệu rất mạnh. Khi user thêm hàng vào giỏ, trang `/cart` cũ vẫn còn lưu trong cache.
 * - Cần gọi `revalidatePath("/cart")` để bắt Next.js xóa cache cũ và fetch dữ liệu mới ngay lập tức.
 *
 * 3. FALLBACK "WRAPPER":
 * - Các hàm `export async function...` ở cuối file là Wrapper.
 * - Tại sao cần Wrapper? -> Để client gọi đơn giản hơn, trả về object `{ success, error }` dễ xử lý hơn là format phức tạp của thư viện.
 * =====================================================================
 */

// --- 1. DEFINING SCHEMAS (Validation Rules) ---

// Schema cập nhật số lượng (số nguyên dương >= 1)
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

// Schema gộp giỏ hàng (Array các items)
const MergeCartSchema = z.array(CartItemSchema);

// --- 2. DEFINING SAFE ACTIONS (Logic) ---

/**
 * Action thêm vào giỏ hàng an toàn.
 * Input: { skuId: string, quantity: number }
 */
const safeAddToCart = protectedActionClient
  .schema(CartItemSchema) // Validate input
  .action(async ({ parsedInput }) => {
    try {
      // Gọi API Backend: POST /cart
      await http("/cart", {
        method: "POST",
        body: JSON.stringify(parsedInput),
        skipRedirectOn401: true, // Để client tự handle 401 (fallback guest cart)
      });

      // Xóa cache của trang /cart để hiển thị dữ liệu mới nhất
      revalidatePath("/cart");

      return { success: true };
    } catch (error: unknown) {
      // Ném lỗi để middleware của safe-action bắt được
      throw error;
    }
  });

/**
 * Action cập nhật số lượng item.
 */
const safeUpdateCartItem = protectedActionClient
  .schema(UpdateCartItemSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Gọi API Backend: PATCH /cart/items/:id
      await http(`/cart/items/${parsedInput.itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: parsedInput.quantity }),
        skipRedirectOn401: true,
      });
      revalidatePath("/cart");
      return { success: true };
    } catch (error: unknown) {
      throw error;
    }
  });

/**
 * Action xóa item khỏi giỏ.
 */
const safeRemoveFromCart = protectedActionClient
  .schema(RemoveCartItemSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Gọi API Backend: DELETE /cart/items/:id
      await http(`/cart/items/${parsedInput.itemId}`, {
        method: "DELETE",
        skipRedirectOn401: true,
      });
      revalidatePath("/cart");
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

/**
 * Action xóa toàn bộ giỏ hàng.
 */
const safeClearCart = protectedActionClient.action(async () => {
  try {
    await http("/cart", {
      method: "DELETE",
      skipRedirectOn401: true,
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    throw error;
  }
});

/**
 * Action Re-order (Mua lại đơn hàng cũ).
 */
const safeReorder = protectedActionClient
  .schema(ReorderSchema)
  .action(async ({ parsedInput }) => {
    try {
      // B1: Lấy chi tiết đơn hàng cũ
      const orderRes = await http<
        ApiResponse<{ items?: { skuId: string; quantity: number }[] }>
      >(`/orders/my-orders/${parsedInput.orderId}`);

      const order = orderRes.data;
      if (!order || !order.items) {
        throw new Error("Order not found or has no items");
      }

      // B2: Thêm từng sản phẩm vào giỏ hàng (Chạy song song)
      const promises = order.items.map(
        (item: { skuId: string; quantity: number }) =>
          http("/cart", {
            method: "POST",
            body: JSON.stringify({
              skuId: item.skuId,
              quantity: item.quantity,
            }),
          })
      );

      // Đợi tất cả request hoàn tất (thành công hay thất bại đều ok)
      await Promise.allSettled(promises);

      revalidatePath("/cart");
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

/**
 * Action gộp giỏ hàng Guest vào User khi đăng nhập.
 */
const safeMergeGuestCart = protectedActionClient
  .schema(MergeCartSchema)
  .action(async ({ parsedInput }) => {
    try {
      const res = await http<unknown[]>("/cart/merge", {
        method: "POST",
        body: JSON.stringify(parsedInput),
      });
      revalidatePath("/cart");
      return { success: true, results: res };
    } catch (error) {
      throw error;
    }
  });

// --- 3. EXPORT FUNCTIONS (Client Wrappers) ---
// wrapper functions giúp Client code gọn hơn, không phải check structure của `next-safe-action` result

/**
 * Wrapper cho tính năng thêm vào giỏ hàng.
 */
export async function addToCartAction(skuId: string, quantity: number = 1) {
  const result = await safeAddToCart({ skuId, quantity });

  // Kiểm tra lỗi từ server hoặc lỗi validation
  if (result?.serverError || result?.validationErrors) {
    return { error: result.serverError || "Validation Failed" };
  }
  return { success: true };
}

/**
 * Wrapper cập nhật số lượng.
 */
export async function updateCartItemAction(itemId: string, quantity: number) {
  const result = await safeUpdateCartItem({ itemId, quantity });
  if (result?.serverError || result?.validationErrors) {
    return { error: result.serverError || "Failed to update item" };
  }
  return { success: true };
}

/**
 * Wrapper xóa sản phẩm.
 */
export async function removeFromCartAction(itemId: string) {
  const result = await safeRemoveFromCart({ itemId });
  if (result?.serverError) return { error: "Failed to remove item" };
  return { success: true };
}

/**
 * Wrapper xóa hết giỏ hàng.
 */
export async function clearCartAction() {
  const result = await safeClearCart();
  if (result?.serverError) return { error: "Failed to clear cart" };
  return { success: true };
}

/**
 * Wrapper Re-order.
 */
export async function reorderAction(orderId: string) {
  const result = await safeReorder({ orderId });
  if (result?.serverError) return { error: result.serverError };
  return { success: true };
}

/**
 * Wrapper Merge Guest Cart.
 */
export async function mergeGuestCartAction(
  items: { skuId: string; quantity: number }[]
) {
  const result = await safeMergeGuestCart(items);
  if (result?.serverError) return { success: false, error: result.serverError };
  if (result?.data) return result.data;
  return { success: false, error: "Merge failed" };
}

// --- 4. PUBLIC ACTIONS (Read-only) ---

/**
 * Lấy chi tiết thông tin sản phẩm cho Guest Cart.
 * Dùng khi user chưa login nhưng có item trong localStorage.
 */
export async function getGuestCartDetailsAction(skuIds: string[]) {
  try {
    const res = await http<ApiResponse<Sku[]>>("/products/skus/details", {
      method: "POST",
      body: JSON.stringify({ skuIds }),
    });
    // Ensure we always default to an array, even if API response is unexpected
    const items = res.data || [];
    return { success: true, data: items };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Không thể lấy thông tin",
    };
  }
}

/**
 * Lấy số lượng item trong giỏ (hiển thị badge trên icon giỏ hàng).
 */
export async function getCartCountAction() {
  // Cần gọi cookies() để đảm bảo context đúng (tránh build error với Static pages)
  await cookies();
  try {
    const response = await http<
      ApiResponse<{
        items: { quantity: number }[];
        totalItems: number;
      }>
    >("/cart", {
      next: { revalidate: 0 },
      skipRedirectOn401: true,
    });

    const cartData = response.data;

    const count =
      cartData.totalItems ??
      cartData.items?.reduce(
        (acc: number, item: { quantity: number }) => acc + (item.quantity || 0),
        0
      ) ??
      0;

    return { success: true, count };
  } catch {
    // Nếu lỗi (vd: chưa login), trả về 0
    return { success: false, count: 0 };
  }
}
