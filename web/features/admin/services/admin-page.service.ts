import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";

/**
 * =====================================================================
 * ADMIN PAGE SERVICE - Domain logic for CMS pages
 * =====================================================================
 */

export const adminPageService = {
  getPages: async (paramsOrPage: any = {}) => {
    const params = normalizePaginationParams(paramsOrPage);
    return http.get<ApiResponse<any[]>>("/pages/admin/list", { params });
  },

  getPageById: async (id: string) => {
    return http.get<ApiResponse<any>>(`/pages/admin/${id}`);
  },

  createPage: async (data: any) => {
    return http.post<ApiResponse<any>>("/pages/admin", data);
  },

  updatePage: async (id: string, data: any) => {
    return http.patch<ApiResponse<any>>(`/pages/admin/${id}`, data);
  },

  deletePage: async (id: string) => {
    return http.delete(`/pages/admin/${id}`);
  },
};
