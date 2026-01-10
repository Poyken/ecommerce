"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/api-helpers";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Permission, Role } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action-utils";

/**
 * =====================================================================
 * ROLE & PERMISSION ACTIONS - Quản lý phân quyền hệ thống (RBAC)
 * =====================================================================
 */

// --- PERMISSIONS ---

export async function createPermissionAction(
  name: string
): Promise<ActionResult<Permission>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Permission>>("/roles/permissions", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to create permission");
}

export async function updatePermissionAction(
  id: string,
  name: string
): Promise<ActionResult<Permission>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Permission>>(
      `/roles/permissions/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }
    );
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to update permission");
}

export async function deletePermissionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/roles/permissions/${id}`, { method: "DELETE" });
    REVALIDATE.admin.roles();
  }, "Failed to delete permission");
}

export async function getPermissionsAction(): Promise<
  ActionResult<Permission[]>
> {
  return wrapServerAction(
    () => http<ApiResponse<Permission[]>>("/roles/permissions"),
    "Failed to fetch permissions"
  );
}

export async function assignPermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/roles/${roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permissionIds }),
    });
    REVALIDATE.admin.roles();
  }, "Failed to assign permissions");
}

// --- ROLES ---

export async function getRolesAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Role[]>> {
  const params = normalizePaginationParams(paramsOrPage, limit, search);

  return wrapServerAction(
    () => http<ApiResponse<Role[]>>("/roles", { params }),
    "Failed to fetch roles"
  );
}

export async function createRoleAction(data: {
  name: string;
  permissions?: string[];
}): Promise<ActionResult<Role>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Role>>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to create role");
}

export async function updateRoleAction(
  id: string,
  data: { name: string; permissions?: string[] }
): Promise<ActionResult<Role>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Role>>(`/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to update role");
}

export async function deleteRoleAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/roles/${id}`, { method: "DELETE" });
    REVALIDATE.admin.roles();
  }, "Failed to delete role");
}
