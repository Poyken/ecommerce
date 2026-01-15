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

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { ReturnRequest } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

/**
 * Lấy danh sách yêu cầu trả hàng cho Admin
 */
export async function getAdminReturnsAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<ReturnRequest[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);

  return wrapServerAction(
    () => http<ApiResponse<ReturnRequest[]>>("/return-requests", { params }),
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
    const res = await http<ApiResponse<ReturnRequest>>(
      `/return-requests/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
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
    () => http<ApiResponse<ReturnRequest>>(`/return-requests/${id}`),
    "Failed to fetch return request details"
  );
}
