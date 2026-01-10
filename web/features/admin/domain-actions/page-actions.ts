"use server";

import { http } from "@/lib/http";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/safe-action-utils";

/**
 * =====================================================================
 * PAGE BUILDER ACTIONS - Quản lý trang tĩnh & Page Builder
 * =====================================================================
 */

export async function getPagesAction(
  params: any = {}
): Promise<ActionResult<any[]>> {
  return wrapServerAction(
    () => http<ApiResponse<any[]>>("/pages", { params }),
    "Failed to fetch pages"
  );
}

export async function getPageByIdAction(
  id: string
): Promise<ActionResult<any>> {
  return wrapServerAction(
    () => http<ApiResponse<any>>(`/pages/${id}`),
    "Failed to fetch page"
  );
}

export async function createPageAction(data: any): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>("/pages", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/pages", "page");
    return res.data;
  }, "Failed to create page");
}

export async function updatePageAction(
  id: string,
  data: any
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>(`/pages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/pages", "page");
    return res.data;
  }, "Failed to update page");
}

export async function deletePageAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/pages/${id}`, { method: "DELETE" });
    revalidatePath("/admin/pages", "page");
  }, "Failed to delete page");
}
