/**
 * =====================================================================
 * USER ADMIN ACTIONS - Quản lý Người dùng (Admin Context)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SCOPE:
 * - Các actions này dành riêng cho Admin (có quyền quản lý user).
 * - KHÁC với các actions user profile (user tự sửa thông tin của mình).
 *
 * 2. CHỨC NĂNG:
 * - CRUD Users: Lấy danh sách, tạo mới (nhân viên), cập nhật role, xóa/khóa user.
 * - Assign Roles: Gán quyền cho user quản trị.
 * - Tất cả đều wrap trong `wrapServerAction` để xử lý lỗi và format trả về chuẩn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Granular Access Control: Quản lý quyền hạn cho toàn bộ nhân viên trong hệ thống, đảm bảo đúng người đúng việc (vd: nhân viên kho chỉ xem được đơn hàng).
 * - Personnel Management: Giám sát và quản lý tài khoản người dùng tập trung, hỗ trợ việc khóa/mở tài khoản tức thì khi có biến cố bảo mật.

 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import {
  CreateUserDto,
  UpdateUserDto,
  ApiResponse,
  ActionResult,
} from "@/types/dtos";
import { User } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import {
  UserQueryParams,
  FileExportResult,
  ImportPreviewResult,
} from "@/types/feature-types/admin.types";

/**
 * =====================================================================
 * USER MANAGEMENT ACTIONS - Quản lý người dùng trong hệ thống
 * =====================================================================
 */

export async function getUsersAction(
  paramsOrPage: UserQueryParams | number = {},
  limit?: number,
  search?: string
): Promise<ActionResult<User[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);
  return wrapServerAction(
    () => http<ApiResponse<User[]>>("/users", { params }),
    "Failed to fetch users"
  );
}

export async function createUserAction(
  data: CreateUserDto
): Promise<ActionResult<User>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.users();
    return res.data;
  }, "Failed to create user");
}

export async function updateUserAction(
  id: string,
  data: UpdateUserDto
): Promise<ActionResult<User>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<User>>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.users();
    return res.data;
  }, "Failed to update user");
}

export async function deleteUserAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/users/${id}`, { method: "DELETE" });
    REVALIDATE.admin.users();
  }, "Failed to delete user");
}

export async function assignRolesAction(
  userId: string,
  roleIds: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ roles: roleIds }),
    });
    REVALIDATE.admin.users();
  }, "Failed to assign roles");
}

export async function exportUsersAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await http<ArrayBuffer>("/users/export/excel", {
      responseType: "arraybuffer",
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, filename: `users_export_${Date.now()}.xlsx` };
  }, "Failed to export users");
}

export async function downloadUserTemplateAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await http<ArrayBuffer>("/users/import/template", {
      responseType: "arraybuffer",
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, filename: "users_import_template.xlsx" };
  }, "Failed to download template");
}

export async function importUsersAction(
  formData: FormData
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http("/users/import/excel", {
      method: "POST",
      body: formData,
    });
    REVALIDATE.admin.users();
  }, "Failed to import users");
}

export async function previewUsersImportAction(
  formData: FormData
): Promise<ActionResult<ImportPreviewResult>> {
  return wrapServerAction(async () => {
    return await http("/users/import/preview", {
      method: "POST",
      body: formData,
    });
  }, "Failed to preview import");
}
