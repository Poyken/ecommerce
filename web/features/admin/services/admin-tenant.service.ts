import { http } from "@/lib/http";
import { ApiResponse, CreateTenantDto, UpdateTenantDto } from "@/types/dtos";
import { Subscription, Tenant } from "@/types/models";
import {
  SubscriptionQueryParams,
  SubscriptionUpdateInput,
} from "@/types/feature-types/admin.types";

/**
 * =====================================================================
 * ADMIN TENANT SERVICE - Domain logic for tenant & subscription management
 * =====================================================================
 */

export const adminTenantService = {
  getTenants: async () => {
    return http.get<ApiResponse<Tenant[]>>("/tenants");
  },

  getTenant: async (id: string) => {
    return http.get<ApiResponse<Tenant>>(`/tenants/${id}`);
  },

  createTenant: async (data: CreateTenantDto) => {
    return http.post<ApiResponse<Tenant>>("/tenants", data);
  },

  updateTenant: async (id: string, data: UpdateTenantDto) => {
    return http.patch<ApiResponse<Tenant>>(`/tenants/${id}`, data);
  },

  deleteTenant: async (id: string) => {
    return http.delete(`/tenants/${id}`);
  },

  getSubscriptions: async (params: SubscriptionQueryParams = {}) => {
    return http.get<ApiResponse<Subscription[]>>("/subscriptions", {
      params: params as Record<string, string | number | boolean>,
    });
  },

  cancelSubscription: async (id: string) => {
    return http.post(`/subscriptions/${id}/cancel`);
  },

  updateSubscription: async (id: string, data: SubscriptionUpdateInput) => {
    return http.post<ApiResponse<Subscription>>(`/subscriptions/${id}`, data);
  },

  deleteSubscription: async (id: string) => {
    return http.delete(`/subscriptions/${id}`);
  },
};
