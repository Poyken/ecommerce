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
  paymentMethod: "COD" | "CARD" | "BANKING" | "VNPAY";
  itemIds?: string[];
  couponCode?: string;
  returnUrl?: string;
}

// --- SAFE ACTIONS ---

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

      revalidatePath("/cart");
      revalidatePath("/orders");

      return { success: true, paymentUrl, orderId };
    } catch (error: unknown) {
      throw error;
    }
  });

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

// --- EXPORTS ---

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
