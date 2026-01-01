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
import { ApiResponse } from "@/types/dtos";
import { Product } from "@/types/models";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
<<<<<<< HEAD:web/features/wishlist/actions.ts
 * Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích (Toggle).
 *
 * @param productId - ID của sản phẩm
=======
 * =====================================================================
 * WISHLIST ACTIONS - Quản lý yêu thích (Server Actions)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ERROR HANDLING & AUTH CHECK:
 * - Trong `getWishlistAction`, ta check `token` trước khi gọi API.
 * - Nếu không có token, trả về mảng rỗng [] ngay thay vì gọi API để rồi nhận lỗi 401.
 * - Đây là cách tối ưu hiệu năng và tránh spam log lỗi ở backend.
 *
 * 2. GUEST WISHLIST MERGING:
 * - `mergeGuestWishlistAction`: Khi user Guest đăng nhập, ta lấy danh sách ID từ localStorage gửi lên để gộp vào DB.
 * =====================================================================
 */

/**
 * Toggle Wishlist Action
 * Adds or Removes item from wishlist.
>>>>>>> 7e5e004 (feat: Implement new e-commerce features including audit, coupons, blog, wishlist, payment, shipping, and various web actions.):web/actions/wishlist.ts
 */
export async function toggleWishlistAction(productId: string) {
  await cookies();
  if (!productId || typeof productId !== "string") {
    return { success: false, error: "Invalid product ID" };
  }

  try {
    const res = await http<ApiResponse<{ isWishlisted: boolean }>>(
      "/wishlist/toggle",
      {
        method: "POST",
        body: JSON.stringify({ productId }),
        skipRedirectOn401: true,
      }
    );

    // Làm mới cache cho các trang liên quan
    revalidatePath("/wishlist");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/shop");

    return { success: true, isWishlisted: res.data.isWishlisted };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("401") || msg.includes("Unauthorized")) {
      return { success: false, requiresAuth: true, error: "Unauthorized" };
    }
    console.error("toggleWishlistAction error details:", {
      productId,
      message: (error as Error).message,
      stack: (error as Error).stack,
      error,
    });
    return { success: false, error: "Failed to update wishlist" };
  }
}

/**
 * Lấy danh sách tất cả sản phẩm trong wishlist của user.
 */
export async function getWishlistAction(): Promise<Product[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  if (!token) {
    return [];
  }

  try {
    const res = await http<ApiResponse<Product[]>>("/wishlist", {
      skipRedirectOn401: true,
    });
    return res?.data || [];
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("401") || msg.includes("Unauthorized")) {
      return [];
    }
    return [];
  }
}

/**
 * Kiểm tra xem một sản phẩm có nằm trong wishlist của user không.
 */
export async function checkWishlistStatusAction(productId: string) {
  await cookies();
  try {
    const res = await http<ApiResponse<{ isWishlisted: boolean }>>(
      `/wishlist/check?productId=${productId}`
    );
    return res.data.isWishlisted;
  } catch {
    return false;
  }
}

/**
 * Hợp nhất danh sách yêu thích từ Guest (localStorage) vào tài khoản user.
 *
 * @param productIds - Danh sách ID sản phẩm từ localStorage
 */
export async function mergeGuestWishlistAction(productIds: string[]) {
  await cookies();
  try {
    const res = await http<ApiResponse<Product[]>>("/wishlist/merge", {
      method: "POST",
      body: JSON.stringify({ productIds }),
    });
    revalidatePath("/wishlist");
    return { success: true, data: res.data };
  } catch {
    return { success: false, error: "Failed to merge wishlist" };
  }
}

/**
 * Lấy số lượng sản phẩm trong wishlist của user (đã đăng nhập).
 */
export async function getWishlistCountAction() {
  await cookies();
  try {
    const res = await http<ApiResponse<{ count: number }>>("/wishlist/count");
    return res.data.count || 0;
  } catch {
    return 0;
  }
}

/**
 * Lấy chi tiết sản phẩm cho Guest Wishlist (dựa trên danh sách IDs).
 */
export async function getGuestWishlistDetailsAction(productIds: string[]) {
  if (!productIds || productIds.length === 0)
    return { success: true, data: [] };

  try {
    // Sử dụng endpoint /products với filter IDs
    const idsString = productIds.join(",");
    const res = await http<ApiResponse<Product[]>>(
      `/products?ids=${idsString}&includeSkus=true&limit=50`
    );

    const items = res?.data || res || [];
    return { success: true, data: items };
  } catch (error: unknown) {
    console.error("Failed to fetch guest wishlist details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch details",
    };
  }
}
