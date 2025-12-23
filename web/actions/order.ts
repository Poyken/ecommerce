/**
 * =====================================================================
 * ORDER SERVER ACTIONS - Quản lý đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các actions quan trọng nhất liên quan đến quy trình mua hàng.
 * Từ việc đặt hàng, thanh toán đến quản lý lịch sử đơn hàng.
 *
 * QUY TRÌNH ĐẶT HÀNG (CHECKOUT FLOW):
 * 1. User điền thông tin giao hàng và chọn phương thức thanh toán.
 * 2. `placeOrderAction` được gọi để tạo đơn hàng trong DB.
 * 3. Nếu chọn VNPAY, action trả về `paymentUrl` để redirect user.
 * 4. Nếu chọn COD, đơn hàng được tạo thành công ngay lập tức.
 * 5. Giỏ hàng được tự động xóa sau khi đặt hàng thành công.
 *
 * ⚠️ LƯU Ý: Backend xử lý việc trừ tồn kho và xóa giỏ hàng trong một Transaction.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { CheckoutSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { Order } from "@/types/models";
import { revalidatePath } from "next/cache";

/**
 * Dữ liệu cần thiết để đặt hàng.
 */
interface PlaceOrderData {
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  addressId?: string;
  paymentMethod: "COD" | "CARD" | "BANKING" | "VNPAY";
  itemIds?: string[];
  couponCode?: string;
  returnUrl?: string;
}

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại.
 */
export async function getMyOrdersAction() {
  try {
    const res = await http<ApiResponse<Order[]>>("/orders/my-orders");
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Thực hiện đặt hàng.
 *
 * @param data - Thông tin đơn hàng và thanh toán
 * @returns Thông tin đơn hàng đã tạo và URL thanh toán (nếu có)
 */
export async function placeOrderAction(data: PlaceOrderData) {
  try {
    const validated = CheckoutSchema.parse(data);
    const res = await http<
      ApiResponse<{
        id: string;
        paymentUrl?: string;
      }>
    >("/orders", {
      method: "POST",
      body: JSON.stringify(validated),
    });

    // URL thanh toán cho các cổng như VNPay
    const paymentUrl = res.data?.paymentUrl;

    // Làm mới cache để cập nhật giỏ hàng (đã trống) và danh sách đơn hàng
    revalidatePath("/cart");
    revalidatePath("/orders");

    if (paymentUrl) {
      return { success: true, paymentUrl, orderId: res.data.id };
    }

    return { success: true, orderId: res.data.id };
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to place order",
    };
  }
}

/**
 * Hủy đơn hàng (chỉ áp dụng cho đơn hàng chưa xử lý).
 *
 * @param orderId - ID của đơn hàng cần hủy
 */
export async function cancelOrderAction(orderId: string) {
  try {
    await http(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to cancel order",
    };
  }
}
