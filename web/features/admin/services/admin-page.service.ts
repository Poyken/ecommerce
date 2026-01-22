import { http } from "@/lib/http";
import { normalizePaginationParams, PaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";
import { CreatePageDto, Page, UpdatePageDto } from "@/types/cms";

/**
 * =====================================================================
 * ADMIN PAGE SERVICE - Domain logic for CMS pages
 * =====================================================================
 */

export const adminPageService = {
  getPages: async (paramsOrPage: number | PaginationParams = {}) => {
    const params = normalizePaginationParams(paramsOrPage);
    return http.get<ApiResponse<Page[]>>("/pages/admin/list", { params });
  },

  getPageById: async (id: string) => {
    return http.get<ApiResponse<Page>>(`/pages/admin/${id}`);
  },

  createPage: async (data: CreatePageDto) => {
    return http.post<ApiResponse<Page>>("/pages/admin", data);
  },

  updatePage: async (id: string, data: UpdatePageDto) => {
    return http.patch<ApiResponse<Page>>(`/pages/admin/${id}`, data);
  },

  deletePage: async (id: string) => {
    return http.delete(`/pages/admin/${id}`);
  },
};
