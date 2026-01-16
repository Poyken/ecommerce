import { http } from "@/lib/http";
import { CreateReturnRequestInput, ReturnRequest } from "@/types/dtos";
import { ApiResponse } from "@/types/api";

/**
 * =====================================================================
 * RETURN SERVICE - Domain logic for return requests (RMA)
 * =====================================================================
 */

export const returnService = {
  getMyReturns: async (page = 1, limit = 10) => {
    return http.get<ApiResponse<ReturnRequest[]>>("/return-requests", {
      params: { page, limit },
      cache: "no-store",
    });
  },

  getReturnRequestDetail: async (id: string) => {
    return http.get<ApiResponse<ReturnRequest>>(`/return-requests/${id}`);
  },

  createReturnRequest: async (data: CreateReturnRequestInput) => {
    return http.post<ApiResponse<ReturnRequest>>("/return-requests", data);
  },

  updateReturnTracking: async (
    id: string,
    data: { trackingCode: string; carrier: string }
  ) => {
    return http.patch<ApiResponse<ReturnRequest>>(
      `/return-requests/${id}/tracking`,
      data
    );
  },
};
