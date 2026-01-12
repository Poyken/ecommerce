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

import { protectedActionClient } from "@/lib/safe-action";
import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getPlansAction = protectedActionClient.action(async () => {
  return http("/plans");
});

export const createPlanAction = protectedActionClient
  .schema(z.any())
  .action(async ({ parsedInput: data }) => {
    const res = await http("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/plans");
    return res;
  });

export const updatePlanAction = protectedActionClient
  .schema(
    z.object({
      id: z.string(),
      data: z.any(),
    })
  )
  .action(async ({ parsedInput: { id, data } }) => {
    const res = await http(`/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/plans");
    return res;
  });

export const deletePlanAction = protectedActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id } }) => {
    const res = await http(`/plans/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/super-admin/plans");
    return res;
  });
