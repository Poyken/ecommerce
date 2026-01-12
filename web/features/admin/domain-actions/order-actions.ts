/**
 * =====================================================================
 * ORDER ADMIN ACTIONS - Xử lý Đơn hàng (Admin Side)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WORKFLOW XỬ LÝ ĐƠN:
 * - Lấy danh sách đơn (`getOrdersAction`) với bộ lọc (search, status).
 * - Xem chi tiết (`getOrderDetailsAction`).
 * - Cập nhật trạng thái (`updateOrderStatusAction`): Duyệt đơn, Giao hàng, Hủy đơn.
 *
 * 2. NOTIFICATIONS:
 * - Khi đổi trạng thái (VD: Shipped), hệ thống thường có tham số `notify: true`
 *   để gửi email/notification cho khách hàng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Order } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

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
  const params = normalizePaginationParams(paramsOrPage, limit, search);

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
    REVALIDATE.admin.orders();
    return res.data;
  }, "Failed to update order status");
}
