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

import { adminUserService } from "../services/admin-user.service";

export async function getUsersAction(
  paramsOrPage: UserQueryParams | number = {},
  limit?: number,
  search?: string
): Promise<ActionResult<User[]>> {
  return wrapServerAction(
    () => adminUserService.getUsers(paramsOrPage, limit, search),
    "Failed to fetch users"
  );
}

export async function createUserAction(
  data: CreateUserDto
): Promise<ActionResult<User>> {
  return wrapServerAction(async () => {
    const res = await adminUserService.createUser(data);
    REVALIDATE.admin.users();
    return res.data;
  }, "Failed to create user");
}

export async function updateUserAction(
  id: string,
  data: UpdateUserDto
): Promise<ActionResult<User>> {
  return wrapServerAction(async () => {
    const res = await adminUserService.updateUser(id, data);
    REVALIDATE.admin.users();
    return res.data;
  }, "Failed to update user");
}

export async function deleteUserAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminUserService.deleteUser(id);
    REVALIDATE.admin.users();
  }, "Failed to delete user");
}

export async function assignRolesAction(
  userId: string,
  roleIds: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminUserService.assignRoles(userId, roleIds);
    REVALIDATE.admin.users();
  }, "Failed to assign roles");
}

export async function exportUsersAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminUserService.exportUsers();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, filename: `users_export_${Date.now()}.xlsx` };
  }, "Failed to export users");
}

export async function downloadUserTemplateAction(): Promise<
  ActionResult<FileExportResult>
> {
  return wrapServerAction(async () => {
    const buffer = await adminUserService.downloadUserTemplate();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, filename: "users_import_template.xlsx" };
  }, "Failed to download template");
}

export async function importUsersAction(
  formData: FormData
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminUserService.importUsers(formData);
    REVALIDATE.admin.users();
  }, "Failed to import users");
}

export async function previewUsersImportAction(
  formData: FormData
): Promise<ActionResult<ImportPreviewResult>> {
  return wrapServerAction(async () => {
    // Note: The service expects generic return but we can trust it matches ImportPreviewResult
    // or cast if needed. The http method returns Promise<any> by default but we can type it better in service.
    // For now, let's cast explicitly or trust the service return.
    // The service returns `any` from http.post currently for this endpoint.
    return (await adminUserService.previewUsersImport(formData)) as any;
  }, "Failed to preview import");
}
