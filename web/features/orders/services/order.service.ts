import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/api";
import { Order } from "@/types/models";
import { CheckoutSchema } from "@/lib/schemas";
import { z } from "zod";

/**
 * =====================================================================
 * ORDER SERVICE - Domain logic for orders
 * =====================================================================
 */

export const orderService = {
  /**
   * Place a new order
   */
  placeOrder: async (data: z.infer<typeof CheckoutSchema>) => {
    return http.post<ApiResponse<{ id: string; paymentUrl?: string }>>(
      "/orders",
      data
    );
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (orderId: string) => {
    return http.patch(`/orders/${orderId}/status`, { status: "CANCELLED" });
  },

  /**
   * Cancel an order with reason (User)
   */
  cancelOrderWithReason: async (
    orderId: string,
    cancellationReason: string
  ) => {
    return http.patch(`/orders/my-orders/${orderId}/cancel`, {
      cancellationReason,
    });
  },

  /**
   * Simulate payment success (Dev/Test)
   */
  simulatePaymentSuccess: async (orderId: string) => {
    return http.patch<ApiResponse<void>>(`/orders/${orderId}/status`, {
      status: "PROCESSING",
      paymentStatus: "PAID",
      notify: true,
    });
  },

  /**
   * Get my orders with pagination
   */
  getMyOrders: async (page = 1, limit = 10) => {
    const params = normalizePaginationParams(page, limit);
    return http.get<ApiResponse<Order[]>>("/orders/my-orders", { params });
  },

  /**
   * Get order details
   */
  getOrderDetails: async (orderId: string) => {
    return http.get<ApiResponse<Order>>(`/orders/${orderId}`);
  },

  /**
   * Get my order details (for user)
   */
  getMyOrderDetails: async (orderId: string) => {
    return http.get<ApiResponse<Order>>(`/orders/my-orders/${orderId}`);
  },
};
