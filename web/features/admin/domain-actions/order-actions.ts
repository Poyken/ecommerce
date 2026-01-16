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
 * - Fulfillment Workflow: Cung cấp các công cụ cho bộ phận kho bãi cập nhật trạng thái đơn hàng (Duyệt, Đóng gói, Giao hàng) một cách chuyên nghiệp.
 * - Customer Transparency: Tự động gửi thông báo khi trạng thái đơn hàng thay đổi, giúp khách hàng luôn biết đơn hàng của mình đang ở đâu, tăng độ tin cậy của dịch vụ.

 * =====================================================================
 */
"use server";

import { ActionResult } from "@/types/dtos";
import { Order } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

import { adminOrderService } from "../services/admin-order.service";

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
