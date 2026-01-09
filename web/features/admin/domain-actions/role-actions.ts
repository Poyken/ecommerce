"use server";

import { http } from "@/lib/http";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { Permission, Role } from "@/types/models";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/server-action-wrapper";

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
    revalidatePath("/admin/permissions", "page");
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
    revalidatePath("/admin/permissions", "page");
    return res.data;
  }, "Failed to update permission");
}

export async function deletePermissionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/roles/permissions/${id}`, { method: "DELETE" });
    revalidatePath("/admin/permissions", "page");
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
    revalidatePath("/admin/roles");
  }, "Failed to assign permissions");
}

// --- ROLES ---

export async function getRolesAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Role[]>> {
  let params: any = {};
  if (
    typeof paramsOrPage === "object" &&
    paramsOrPage !== null &&
    !Array.isArray(paramsOrPage)
  ) {
    params = paramsOrPage;
  } else {
    params = { page: paramsOrPage, limit, search };
  }

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
    revalidatePath("/admin/roles", "page");
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
    revalidatePath("/admin/roles", "page");
    return res.data;
  }, "Failed to update role");
}

export async function deleteRoleAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/roles/${id}`, { method: "DELETE" });
    revalidatePath("/admin/roles", "page");
  }, "Failed to delete role");
}
