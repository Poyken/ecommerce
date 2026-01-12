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
 *   và trả về lỗi validation chi tiết cho Client.
 * =====================================================================
 */
"use server";

import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { http } from "@/lib/http";
import { z } from "zod";
import { ApiResponse } from "@/types/dtos";

export async function getPlansAction() {
  return wrapServerAction(
    () => http<ApiResponse<any[]>>("/plans"),
    "Failed to fetch plans"
  );
}

export async function createPlanAction(data: any) {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>("/plans", {
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
  data: any;
}) {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>(`/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.path("/super-admin/plans");
    return res.data;
  }, "Failed to update plan");
}

export async function deletePlanAction({ id }: { id: string }) {
  return wrapServerAction(async () => {
    await http(`/plans/${id}`, {
      method: "DELETE",
    });
    REVALIDATE.path("/super-admin/plans");
  }, "Failed to delete plan");
}
