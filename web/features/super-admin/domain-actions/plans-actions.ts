/**
 * =====================================================================
 * PLANS ACTIONS - Quản lý Gói dịch vụ (Super Admin SaaS)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. `protectedActionClient`:
 * - Sử dụng thư viện `next-safe-action`.
 * - Tự động validate input bằng Zod schema (`.schema(...)`).
 * - Tự động check auth (chỉ Super Admin mới gọi được).
 *
 * 2. TYPE SAFETY:
 * - Input (data từ form) được ép kiểu chặt chẽ. Nếu sai format, action sẽ không chạy
 *   và trả về lỗi validation chi tiết cho Client. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Recurring Revenue: Quản lý các gói đăng ký thuê phần mềm (SaaS), tự động hóa việc gia hạn và tính phí cho các chủ shop.
 * - Access Control: Đảm bảo chỉ những chủ shop đã thanh toán gói "Enterprise" mới được dùng các tính năng cao cấp (vd: Analytics nâng cao).

 * =====================================================================
 */
"use server";

import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { http } from "@/lib/http";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Plan, PlanInput } from "@/types/feature-types/admin.types";

export async function getPlansAction(): Promise<ActionResult<Plan[]>> {
  return wrapServerAction(
    () => http<ApiResponse<Plan[]>>("/plans"),
    "Failed to fetch plans"
  );
}

export async function createPlanAction(
  data: PlanInput
): Promise<ActionResult<Plan>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Plan>>("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.path("/super-admin/plans");
    return res.data;
  }, "Failed to create plan");
}

export async function updatePlanAction({
  id,
  data,
}: {
  id: string;
  data: Partial<PlanInput>;
}): Promise<ActionResult<Plan>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Plan>>(`/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.path("/super-admin/plans");
    return res.data;
  }, "Failed to update plan");
}

export async function deletePlanAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/plans/${id}`, {
      method: "DELETE",
    });
    REVALIDATE.path("/super-admin/plans");
  }, "Failed to delete plan");
}
