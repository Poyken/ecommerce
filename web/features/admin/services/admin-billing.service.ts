import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Subscription } from "@/types/models";

/**
 * =====================================================================
 * ADMIN BILLING SERVICE - Domain logic for billing/subscription
 * =====================================================================
 */

export const adminBillingService = {
  /**
   * Get current tenant subscription
   */
  getCurrentSubscription: async () => {
    return http.get<ApiResponse<Subscription>>("/subscriptions/current");
  },
};
