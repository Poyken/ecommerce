import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";
import { Permission, Role } from "@/types/models";

/**
 * =====================================================================
 * ADMIN ROLE SERVICE - Domain logic for admin role management (RBAC)
 * =====================================================================
 */

export const adminRoleService = {
  // --- PERMISSIONS ---

  createPermission: async (name: string) => {
    return http.post<ApiResponse<Permission>>("/roles/permissions", { name });
  },

  updatePermission: async (id: string, name: string) => {
    return http.patch<ApiResponse<Permission>>(`/roles/permissions/${id}`, {
      name,
    });
  },

  deletePermission: async (id: string) => {
    return http.delete(`/roles/permissions/${id}`);
  },

  getPermissions: async () => {
    return http.get<ApiResponse<Permission[]>>("/roles/permissions");
  },

  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    return http.post(`/roles/${roleId}/permissions`, {
      permissions: permissionIds,
    });
  },

  // --- ROLES ---

  getRoles: async (paramsOrPage: any = {}, limit?: number, search?: string) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Role[]>>("/roles", { params });
  },

  createRole: async (data: { name: string; permissions?: string[] }) => {
    return http.post<ApiResponse<Role>>("/roles", data);
  },

  updateRole: async (
    id: string,
    data: { name: string; permissions?: string[] }
  ) => {
    return http.patch<ApiResponse<Role>>(`/roles/${id}`, data);
  },

  deleteRole: async (id: string) => {
    return http.delete(`/roles/${id}`);
  },
};
