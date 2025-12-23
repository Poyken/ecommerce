/**
 * =====================================================================
 * CART SERVER ACTIONS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * SERVER ACTIONS LÀ GÌ?
 * - Là các hàm async chạy trên Server, nhưng được gọi trực tiếp từ Client Component.
 * - Thay thế cho việc phải tạo API Route (`/api/...`) thủ công.
 * - Directive `"use server"` ở đầu file là BẮT BUỘC.
 *
 * CƠ CHẾ HOẠT ĐỘNG:
 * 1. Client gọi `addToCartAction(skuId, 1)`.
 * 2. Next.js gửi POST request ngầm đến server.
 * 3. Server thực thi hàm, gọi Backend API (qua `http` lib).
 * 4. `revalidatePath("/cart")`: Lệnh cho Next.js xóa cache trang Cart,
 *    khiến trang này tự động fetch lại dữ liệu mới nhất.
 *
 * ƯU ĐIỂM:
 * - Code gọn gàng, logic nằm cùng một chỗ.
 * - Type-safe từ đầu đến cuối.
 * - Không lộ logic gọi API ra phía Client (bảo mật hơn).
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { CartItemSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { Sku } from "@/types/models";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Thêm sản phẩm vào giỏ hàng.
 *
 * @param skuId - ID của SKU (biến thể sản phẩm) cần thêm
 * @param quantity - Số lượng (mặc định = 1)
 * @returns { success: true } hoặc { error: "message" }
 *
 * 📝 LƯU Ý:
 * - Backend tự động kiểm tra tồn kho
 * - Nếu SKU đã có trong giỏ → cộng dồn số lượng
 */
export async function addToCartAction(skuId: string, quantity: number = 1) {
  await cookies();
  try {
    const validated = CartItemSchema.parse({ skuId, quantity });
    await http("/cart", {
      method: "POST",
      body: JSON.stringify(validated),
      skipRedirectOn401: true,
    });
    // Revalidate cache để giỏ hàng cập nhật ngay
    revalidatePath("/cart");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add to cart";
    console.error("Thêm vào giỏ hàng thất bại:", error);
    return { error: errorMessage };
  }
}

/**
 * Cập nhật số lượng của một item trong giỏ.
 * Được gọi khi user tăng/giảm số lượng ở trang giỏ hàng.
 *
 * @param itemId - ID của CartItem cần cập nhật
 * @param quantity - Số lượng mới
 */
export async function updateCartItemAction(itemId: string, quantity: number) {
  await cookies();
  try {
    await http(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
      skipRedirectOn401: true,
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error: unknown) {
    console.error("Cập nhật mục giỏ hàng thất bại", error);
    const message =
      error instanceof Error ? error.message : "Failed to update item";

    // Type assertion for custom error body if needed
    const errorBody = (
      error as {
        body?: {
          message?: { availableStock?: number };
          availableStock?: number;
        };
      }
    )?.body;
    const availableStock =
      errorBody?.message?.availableStock || errorBody?.availableStock;

    return {
      error: message,
      availableStock,
    };
  }
}

/**
 * Xóa một item khỏi giỏ hàng.
 *
 * @param itemId - ID của CartItem cần xóa
 */
export async function removeFromCartAction(itemId: string) {
  await cookies();
  try {
    await http(`/cart/items/${itemId}`, {
      method: "DELETE",
      skipRedirectOn401: true,
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Xóa mục giỏ hàng thất bại", error);
    return { error: "Failed to remove item" };
  }
}

/**
 * Xóa toàn bộ giỏ hàng.
 */
export async function clearCartAction() {
  await cookies();
  try {
    await http("/cart", {
      method: "DELETE",
      skipRedirectOn401: true,
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Xóa giỏ hàng thất bại", error);
    return { error: "Failed to clear cart" };
  }
}

/**
 * Đặt lại đơn hàng cũ (Mua lại).
 * Copy tất cả items từ đơn hàng cũ vào giỏ hàng hiện tại.
 *
 * @param orderId - ID của đơn hàng muốn đặt lại
 * @returns { success: true } hoặc { error: "message" }
 *
 * 📝 LƯU Ý:
 * - Sử dụng Promise.allSettled để continue nếu một số items fail
 * - Items fail có thể do hết hàng hoặc SKU bị vô hiệu hóa
 */
export async function reorderAction(orderId: string) {
  await cookies();
  try {
    // 1. Lấy thông tin đơn hàng cũ
    const orderRes = await http<
      ApiResponse<{ items?: { skuId: string; quantity: number }[] }>
    >(`/orders/my-orders/${orderId}`);
    const order = orderRes.data;

    if (!order || !order.items) {
      throw new Error("Order not found or has no items");
    }

    // 2. Thêm từng item vào giỏ hàng
    // Dùng Promise.allSettled để tiếp tục với các items còn lại nếu một item fail
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

    await Promise.allSettled(promises);

    revalidatePath("/cart");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reorder";
    console.error("Reorder failed:", error);
    return { error: errorMessage };
  }
}

/**
 * Lấy số lượng items trong giỏ hàng của user đã đăng nhập.
 * Dùng để hiển thị badge số lượng trên icon giỏ hàng.
 *
 * @returns { success: boolean, count: number }
 *
 * 📝 LƯU Ý KỸ THUẬT:
 * - Xử lý cả response wrapped (có TransformInterceptor) và unwrapped
 * - Trả về count = 0 nếu user chưa login hoặc chưa có cart
 */
export async function getCartCountAction() {
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

    // Xử lý cả wrapped và unwrapped responses
    // TransformInterceptor của NestJS wrap response trong {data: {...}}
    const cartData = response.data || response;

    // Ưu tiên dùng totalItems, nếu không có thì tính từ items array
    const count =
      cartData.totalItems ||
      cartData.items?.reduce(
        (acc: number, item: { quantity: number }) => acc + (item.quantity || 0),
        0
      ) ||
      0;

    return { success: true, count };
  } catch {
    // User có thể chưa có cart hoặc chưa đăng nhập
    return { success: false, count: 0 };
  }
}

/**
 * Lấy chi tiết sản phẩm cho Guest Cart.
 *
 * Guest cart chỉ lưu { skuId, quantity } trong localStorage.
 * Action này gọi API để lấy thông tin đầy đủ (tên, giá, ảnh, etc.)
 */
export async function getGuestCartDetailsAction(skuIds: string[]) {
  try {
    const res = await http<ApiResponse<Sku[]>>("/products/skus/details", {
      method: "POST",
      body: JSON.stringify({ skuIds }),
    });

    const items = Array.isArray(res) ? res : res.data;
    return { success: true, data: items };
  } catch (error: unknown) {
    console.error("Lấy chi tiết guest cart thất bại:", error);
    return {
      error: error instanceof Error ? error.message : "Không thể lấy thông tin",
    };
  }
}

/**
 * Merge Guest Cart action
 */
export async function mergeGuestCartAction(
  items: { skuId: string; quantity: number }[]
) {
  await cookies();
  try {
    const res = await http<unknown[]>("/cart/merge", {
      method: "POST",
      body: JSON.stringify(items),
    });

    revalidatePath("/cart");
    // Return the merge results which might contain "capped" info
    return { success: true, results: res };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Merge failed",
    };
  }
}
