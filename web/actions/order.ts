"use server";

import { http } from "@/lib/http";
import { CheckoutSchema } from "@/lib/schemas";
import { Order } from "@/types/models";
import { revalidatePath } from "next/cache";

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
 * =====================================================================
 * ORDER ACTIONS - Xử lý đặt hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ATOMIC ORDER PLACEMENT:
 * - Server Action `placeOrderAction` gọi API tạo đơn hàng. Backend sẽ xử lý Transaction:
 *   + Tạo Order
 *   + Tạo OrderItems
 *   + Trừ tồn kho (Stock)
 *   + Xóa giỏ hàng (Cart)
 * - Tất cả phải thành công hoặc cùng thất bại (ACID), đảm bảo không bị mất tiền hay lệch kho.
 *
 * 2. PAYMENT REDIRECT:
 * - Với VNPay/Momo, API trả về `paymentUrl`.
 * - Action nhận URL này và Client sẽ `window.location.href = url` hoặc `router.push()`.
 * - Không redirect trực tiếp trong Action server-side vì cần xử lý state ở Client trước.
 * =====================================================================
 */

export async function getMyOrdersAction() {
  try {
    const res = await http<{ data: Order[] }>("/orders/my-orders");
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function placeOrderAction(data: PlaceOrderData) {
  try {
    const validated = CheckoutSchema.parse(data);
    const res = await http<{
      id: string;
      paymentUrl?: string;
    }>("/orders", {
      method: "POST",
      body: JSON.stringify(validated),
    });

    // Check if we need to redirect (VNPay)
    const paymentUrl = res?.paymentUrl;

    // Only revalidate if not redirecting immediately, or revalidate anyway logic?
    // In VNPay flow: User goes to VNPay -> Returns to Success Page.
    // The cart should be cleared on success page or by backend.
    // Backend clears cart in atomic transaction! So cart is empty in DB.
    // So revalidatePath here works fine even if we redirect.
    revalidatePath("/cart");
    revalidatePath("/orders");

    if (paymentUrl) {
      return { success: true, paymentUrl, orderId: res.id };
    }

    return { success: true, orderId: res.id };
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to place order",
    };
  }
}

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
