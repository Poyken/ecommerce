
"use server";

import { ActionResult } from "@/types/dtos";
import { Order } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { PaginationParams } from "@/lib/utils";

import { adminOrderService } from "../services/admin-order.service";

/**
 * =====================================================================
 * ADMIN ORDER ACTIONS - Quản lý đơn hàng (Admin Panel)
 * =====================================================================
 */

export async function getOrdersAction(
  paramsOrPage: number | PaginationParams = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Order[]>> {
  return wrapServerAction(
    () => adminOrderService.getOrders(paramsOrPage, limit, search),
    "Failed to fetch orders"
  );
}

export async function getOrderDetailsAction(
  id: string
): Promise<ActionResult<Order>> {
  return wrapServerAction(
    () => adminOrderService.getOrderDetails(id),
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
    const res = await adminOrderService.updateOrderStatus(
      id,
      status,
      notify,
      reason
    );
    REVALIDATE.admin.orders();
    return res.data;
  }, "Failed to update order status");
}
