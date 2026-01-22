import { http } from "@/lib/http";
import { normalizePaginationParams, PaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";
import { Order } from "@/types/models";

/**
 * =====================================================================
 * ADMIN ORDER SERVICE - Domain logic for admin order management
 * =====================================================================
 */

export const adminOrderService = {
  getOrders: async (
    paramsOrPage: number | PaginationParams = {},
    limit?: number,
    search?: string
  ) => {
    const params = normalizePaginationParams(paramsOrPage, limit, search);
    return http.get<ApiResponse<Order[]>>("/orders", { params });
  },

  getOrderDetails: async (id: string) => {
    return http.get<ApiResponse<Order>>(`/orders/${id}`);
  },

  updateOrderStatus: async (
    id: string,
    status: string,
    notify?: boolean,
    reason?: string
  ) => {
    return http.patch<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
      notify,
      cancellationReason: reason,
    });
  },

  /**
   * Get recent orders for dashboard (with items)
   */
  getRecentOrders: async (limit = 5) => {
    return http.get<{ data: Order[] }>(
      `/orders?limit=${limit}&includeItems=true`
    );
  },
};
