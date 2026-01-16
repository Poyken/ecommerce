/**
 * =====================================================================
 * RETURN ADMIN ACTIONS - Xử lý Trả hàng (Admin Side)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RMA MANAGEMENT:
 * - Lấy danh sách yêu cầu trả hàng (`getAdminReturnsAction`).
 * - Cập nhật trạng thái và ghi chú kiểm hàng (`updateReturnStatusAction`).
 *
 * 2. LIFECYCLE:
 * - Admin duyệt yêu cầu (Approved), nhận hàng (Received), và hoàn tiền (Refunded).
 * - Mọi thay đổi đều được revalidate để UI cập nhật realtime.
 * =====================================================================
 */
"use server";

import { adminReturnService } from "../services/admin-return.service";
import { ActionResult } from "@/types/dtos";
import { ReturnRequest } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

/**
 * Láy danh sách yêu cầu trả hàng cho Admin
 */
export async function getAdminReturnsAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<ReturnRequest[]>> {
  return wrapServerAction(
    () => adminReturnService.getReturns(paramsOrPage, limit, search),
    "Failed to fetch return requests"
  );
}

/**
 * Cập nhật trạng thái và thông tin kiểm định cho yêu cầu trả hàng
 */
export async function updateReturnStatusAction(
  id: string,
  data: {
    status: string;
    inspectionNotes?: string;
    rejectedReason?: string;
  }
): Promise<ActionResult<ReturnRequest>> {
  return wrapServerAction(async () => {
    const res = await adminReturnService.updateReturnStatus(id, data);
    REVALIDATE.returns();
    return res.data;
  }, "Failed to update return request");
}

/**
 * Lấy chi tiết yêu cầu trả hàng
 */
export async function getReturnDetailsAction(
  id: string
): Promise<ActionResult<ReturnRequest>> {
  return wrapServerAction(
    () => adminReturnService.getReturnDetails(id),
    "Failed to fetch return request details"
  );
}
