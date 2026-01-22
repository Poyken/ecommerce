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

import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { adminPageService } from "../services/admin-page.service";
import { ActionResult } from "@/types/dtos";
import { CreatePageDto, Page, UpdatePageDto } from "@/types/cms";
import { PaginationParams } from "@/lib/utils";

/**
 * =====================================================================
 * PAGE BUILDER ACTIONS - Quản lý trang tĩnh & Page Builder
 * =====================================================================
 */

export async function getPagesAction(
  paramsOrPage: number | PaginationParams = {}
): Promise<ActionResult<Page[]>> {
  return wrapServerAction(
    () => adminPageService.getPages(paramsOrPage),
    "Failed to fetch pages"
  );
}

export async function getPageByIdAction(
  id: string
): Promise<ActionResult<Page>> {
  return wrapServerAction(
    () => adminPageService.getPageById(id),
    "Failed to fetch page"
  );
}

export async function createPageAction(
  data: CreatePageDto
): Promise<ActionResult<Page>> {
  return wrapServerAction(async () => {
    const res = await adminPageService.createPage(data);
    REVALIDATE.admin.pages();
    return res.data;
  }, "Failed to create page");
}

export async function updatePageAction(
  id: string,
  data: UpdatePageDto
): Promise<ActionResult<Page>> {
  return wrapServerAction(async () => {
    const res = await adminPageService.updatePage(id, data);
    REVALIDATE.admin.pages();
    return res.data;
  }, "Failed to update page");
}

export async function deletePageAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminPageService.deletePage(id);
    REVALIDATE.admin.pages();
  }, "Failed to delete page");
}
