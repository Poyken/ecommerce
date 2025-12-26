"use server";

import { http } from "@/lib/http";
import { protectedActionClient } from "@/lib/safe-action";
import { CheckoutSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { Order } from "@/types/models";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * =====================================================================
 * ORDER SERVER ACTIONS - Quản lý đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SAFE ACTION CLIENT (`protectedActionClient`):
 * - Thay vì dùng `export async function...` trần trụi, ta bọc logic trong `safe-action`.
 * - Lợi ích:
 *   + Tự động validate input với Zod schema (`.schema(...)`).
 *   + Tự động handle try-catch lỗi hệ thống.
 *   + Type-safety cho input và output trả về client.
 *   + Middleware authentication đã được tích hợp sẵn (check login).
 *
 * 2. REVALIDATION:
 * - Sau khi tạo đơn hoặc hủy đơn, ta gọi `revalidatePath`.
 * - Mục đích: Xóa cache cũ của Next.js để UI cập nhật ngay lập tức (vd: giỏ hàng về 0, danh sách đơn hàng có thêm đơn mới).
 *
 * 3. SIMULATION ACTION:
 * - `simulatePaymentSuccessAction`: Chỉ dùng cho môi trường Dev/Test để giả lập việc thanh toán thành công mà không cần qua cổng thanh toán thật.
 * =====================================================================
 */

const CancelOrderSchema = z.object({
  orderId: z.string(),
});

/**
 * Dữ liệu cần thiết để đặt hàng.
 */
interface PlaceOrderData {
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  addressId?: string;
  paymentMethod: "COD" | "CARD" | "BANKING" | "VNPAY" | "MOMO";
  itemIds?: string[];
  couponCode?: string;
  returnUrl?: string;
}

// --- SAFE ACTIONS ---

// Action đặt hàng - Được bảo vệ bằng Authentication và Zod Validation
const safePlaceOrder = protectedActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput }) => {
    try {
      const res = await http<
        ApiResponse<{
          id: string;
          paymentUrl?: string;
        }>
      >("/orders", {
        method: "POST",
        body: JSON.stringify(parsedInput),
      });

      const paymentUrl = res.data?.paymentUrl;
      const orderId = res.data?.id;

      // Xóa cache các trang liên quan để hiển thị dữ liệu mới nhất
      revalidatePath("/cart");
      revalidatePath("/orders");

      return { success: true, paymentUrl, orderId };
    } catch (error: unknown) {
      throw error;
    }
  });

// Action hủy đơn hàng
const safeCancelOrder = protectedActionClient
  .schema(CancelOrderSchema)
  .action(async ({ parsedInput }) => {
    try {
      await http(`/orders/${parsedInput.orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      revalidatePath("/orders");
      revalidatePath(`/orders/${parsedInput.orderId}`);
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

// --- EXPORTS (Wrapper Functions) ---

export async function getMyOrdersAction(page = 1, limit = 10) {
  try {
    const res = await http<ApiResponse<Order[]>>(
      `/orders/my-orders?page=${page}&limit=${limit}`
    );
    return res;
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function placeOrderAction(data: PlaceOrderData) {
  const result = await safePlaceOrder(data);

  if (result?.serverError || result?.validationErrors) {
    if (result.validationErrors) {
      console.error(
        "Validation Errors:",
        JSON.stringify(result.validationErrors, null, 2)
      );
    }
    return { error: result.serverError || "Invalid order data" };
  }

  // result.data contains { success, paymentUrl, orderId }
  return result.data;
}

export async function cancelOrderAction(orderId: string) {
  const result = await safeCancelOrder({ orderId });

  if (result?.serverError) {
    return { error: result.serverError };
  }

  return { success: true };
}

/**
 * Lấy chi tiết một đơn hàng của người dùng hiện tại.
 */
export async function getOrderDetailsAction(orderId: string) {
  try {
    const res = await http<ApiResponse<Order>>(`/orders/${orderId}`);
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * SIMULATION ONLY: Mark order as Paid (Processing) to simulate webhook.
 */
export async function simulatePaymentSuccessAction(orderId: string) {
  try {
    const res = await http(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "PROCESSING",
        paymentStatus: "PAID",
        notify: true,
      }),
    });
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}
