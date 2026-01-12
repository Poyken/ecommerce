/**
 * =====================================================================
 * PAGE BUILDER ACTIONS - Quản lý CMS Pages
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CMS (Content Management System):
 * - Hệ thống cho phép Marketing/Admin tự tạo Landing Page mà không cần Dev code.
 * - Lưu trữ cấu trúc page dưới dạng JSON Blocks.
 *
 * 2. CRUD:
 * - Tạo, Sửa (JSON Blocks), Xóa page.
 * - `revalidatePath` (thông qua `REVALIDATE`) cực quan trọng ở đây để khi Admin sửa xong,
 *   User ngoài trang chủ thấy content mới ngay lập tức (Next.js ISR/On-demand Revalidation). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Marketing Agility: Cho phép đội ngũ Marketing tự do thiết kế các trang Landing Page cho chiến dịch Sale mà không cần phụ thuộc vào đội ngũ Kỹ thuật.
 * - Dynamic CMS: Quản lý nội dung website linh hoạt qua hệ thống Blocks JSON, cho phép cập nhật giao diện ngay lập tức nhờ cơ chế On-demand Revalidation của Next.js.

 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * PAGE BUILDER ACTIONS - Quản lý trang tĩnh & Page Builder
 * =====================================================================
 */

export async function getPagesAction(
  paramsOrPage: any = {}
): Promise<ActionResult<any[]>> {
  const params = normalizePaginationParams(paramsOrPage);
  return wrapServerAction(
    () => http<ApiResponse<any[]>>("/pages/admin/list", { params }),
    "Failed to fetch pages"
  );
}

export async function getPageByIdAction(
  id: string
): Promise<ActionResult<any>> {
  return wrapServerAction(
    () => http<ApiResponse<any>>(`/pages/admin/${id}`),
    "Failed to fetch page"
  );
}

export async function createPageAction(data: any): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>("/pages/admin", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.pages();
    return res.data;
  }, "Failed to create page");
}

export async function updatePageAction(
  id: string,
  data: any
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>(`/pages/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.pages();
    return res.data;
  }, "Failed to update page");
}

export async function deletePageAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/pages/admin/${id}`, { method: "DELETE" });
    REVALIDATE.admin.pages();
  }, "Failed to delete page");
}
