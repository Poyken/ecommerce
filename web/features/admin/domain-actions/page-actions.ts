
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
