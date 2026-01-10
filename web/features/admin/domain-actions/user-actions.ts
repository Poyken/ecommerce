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
      body: JSON.stringify({ roleIds }),
    });
    REVALIDATE.admin.users();
  }, "Failed to assign roles");
}
