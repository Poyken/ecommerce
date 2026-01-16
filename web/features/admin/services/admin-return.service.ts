import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";
import { ReturnRequest } from "@/types/models";

/**
 * =====================================================================
 * ADMIN RETURN SERVICE - Domain logic for admin return requests
 * =====================================================================
 */

export const adminReturnService = {
  getReturns: async (
    paramsOrPage: any = {},
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<ReturnRequest[]>>("/return-requests", {
      params,
    });
  },

  getReturnDetails: async (id: string) => {
    return http.get<ApiResponse<ReturnRequest>>(`/return-requests/${id}`);
  },

  updateReturnStatus: async (
    id: string,
    data: {
      status: string;
      inspectionNotes?: string;
      rejectedReason?: string;
    }
  ) => {
    return http.patch<ApiResponse<ReturnRequest>>(
      `/return-requests/${id}`,
      data
    );
  },
};
