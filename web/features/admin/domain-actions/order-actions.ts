"use server";

import { http } from "@/lib/http";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Order } from "@/types/models";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/safe-action-utils";

/**
 * =====================================================================
 * ADMIN ORDER ACTIONS - Quản lý đơn hàng (Admin Panel)
 * =====================================================================
 */

export async function getOrdersAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Order[]>> {
  let params: any = {};
  if (
    typeof paramsOrPage === "object" &&
    paramsOrPage !== null &&
    !Array.isArray(paramsOrPage)
  ) {
    params = paramsOrPage;
  } else {
    params = { page: paramsOrPage, limit, search };
  }

  return wrapServerAction(
    () => http<ApiResponse<Order[]>>("/orders", { params }),
    "Failed to fetch orders"
  );
}

export async function getOrderDetailsAction(
  id: string
): Promise<ActionResult<Order>> {
  return wrapServerAction(
    () => http<ApiResponse<Order>>(`/orders/${id}`),
    "Failed to fetch order details"
  );
}

export async function updateOrderStatusAction(
  id: string,
  status: string,
  notify?: boolean,
  reason?: string
): Promise<ActionResult<Order>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Order>>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        notify,
        cancellationReason: reason,
      }),
    });
    revalidatePath("/admin/orders", "page");
    return res.data;
  }, "Failed to update order status");
}
