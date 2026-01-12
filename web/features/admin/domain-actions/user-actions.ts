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
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

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

/**
 * =====================================================================
 * USER MANAGEMENT ACTIONS - Quản lý người dùng trong hệ thống
 * =====================================================================
 */

export async function getUsersAction(
  paramsOrPage: any = {},
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
