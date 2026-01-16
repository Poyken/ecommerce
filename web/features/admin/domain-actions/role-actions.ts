/**
 * =====================================================================
 * ROLE ACTIONS - Quản lý Vai trò & Quyền hạn
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONCEPT: RBAC (Role-Based Access Control)
 * - Users có Roles.
 * - Roles có Permissions.
 * - Thay vì gán quyền lẻ tẻ cho từng user, ta gán Role.
 *
 * 2. ACTIONS:
 * - `createRole`, `updateRole`, `deleteRole`: CRUD Roles.
 * - `assignPermissionsAction`: Quan trọng nhất. Quy định Role này làm được gì.
 *   (VD: Role "Editor" được `create:product`, `update:product`...). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Enterprise Authorization: Thiết lập hệ thống phân quyền chuyên nghiệp theo vai trò (Roles), giúp dễ dàng quản lý quyền hạn cho hàng trăm nhân viên với các nhiệm vụ khác nhau.
 * - Scalable Security: Cho phép mở rộng hệ thống bảo mật bằng cách định nghĩa các Permission mới (vd: `export:report`) và gán chúng vào các Role tương ứng một cách linh hoạt.

 * =====================================================================
 */
"use server";

import { ActionResult } from "@/types/dtos";
import { Permission, Role } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

import { adminRoleService } from "../services/admin-role.service";

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
    const res = await adminRoleService.createPermission(name);
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to create permission");
}

export async function updatePermissionAction(
  id: string,
  name: string
): Promise<ActionResult<Permission>> {
  return wrapServerAction(async () => {
    const res = await adminRoleService.updatePermission(id, name);
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to update permission");
}

export async function deletePermissionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminRoleService.deletePermission(id);
    REVALIDATE.admin.roles();
  }, "Failed to delete permission");
}

export async function getPermissionsAction(): Promise<
  ActionResult<Permission[]>
> {
  return wrapServerAction(
    () => adminRoleService.getPermissions(),
    "Failed to fetch permissions"
  );
}

export async function assignPermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminRoleService.assignPermissions(roleId, permissionIds);
    REVALIDATE.admin.roles();
  }, "Failed to assign permissions");
}

// --- ROLES ---

export async function getRolesAction(
  paramsOrPage: any = {},
  limit?: number,
  search?: string
): Promise<ActionResult<Role[]>> {
  return wrapServerAction(
    () => adminRoleService.getRoles(paramsOrPage, limit, search),
    "Failed to fetch roles"
  );
}

export async function createRoleAction(data: {
  name: string;
  permissions?: string[];
}): Promise<ActionResult<Role>> {
  return wrapServerAction(async () => {
    const res = await adminRoleService.createRole(data);
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to create role");
}

export async function updateRoleAction(
  id: string,
  data: { name: string; permissions?: string[] }
): Promise<ActionResult<Role>> {
  return wrapServerAction(async () => {
    const res = await adminRoleService.updateRole(id, data);
    REVALIDATE.admin.roles();
    return res.data;
  }, "Failed to update role");
}

export async function deleteRoleAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminRoleService.deleteRole(id);
    REVALIDATE.admin.roles();
  }, "Failed to delete role");
}
