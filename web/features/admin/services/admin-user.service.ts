import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, CreateUserDto, UpdateUserDto } from "@/types/dtos";
import { User } from "@/types/models";
import { UserQueryParams } from "@/types/feature-types/admin.types";

/**
 * =====================================================================
 * ADMIN USER SERVICE - Domain logic for user management (Admin)
 * =====================================================================
 */

export const adminUserService = {
  getUsers: async (
    paramsOrPage: UserQueryParams | number = {},
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<User[]>>("/users", { params });
  },

  createUser: async (data: CreateUserDto) => {
    return http.post<ApiResponse<User>>("/users", data);
  },

  updateUser: async (id: string, data: UpdateUserDto) => {
    return http.patch<ApiResponse<User>>(`/users/${id}`, data);
  },

  deleteUser: async (id: string) => {
    return http.delete(`/users/${id}`);
  },

  assignRoles: async (userId: string, roleIds: string[]) => {
    return http.post(`/users/${userId}/roles`, { roles: roleIds });
  },

  exportUsers: async () => {
    return http.get<ArrayBuffer>("/users/export/excel", {
      responseType: "arraybuffer",
    });
  },

  downloadUserTemplate: async () => {
    return http.get<ArrayBuffer>("/users/import/template", {
      responseType: "arraybuffer",
    });
  },

  importUsers: async (formData: FormData) => {
    return http.post("/users/import/excel", formData);
  },

  previewUsersImport: async (formData: FormData) => {
    return http.post("/users/import/preview", formData);
  },
};
