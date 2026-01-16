import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Plan, PlanInput } from "@/types/feature-types/admin.types";

/**
 * =====================================================================
 * SUPER ADMIN PLAN SERVICE - Domain logic for subscription plans
 * =====================================================================
 */

export const superAdminPlanService = {
  getPlans: async () => {
    return http.get<ApiResponse<Plan[]>>("/plans");
  },

  createPlan: async (data: PlanInput) => {
    return http.post<ApiResponse<Plan>>("/plans", data);
  },

  updatePlan: async (id: string, data: Partial<PlanInput>) => {
    return http.patch<ApiResponse<Plan>>(`/plans/${id}`, data);
  },

  deletePlan: async (id: string) => {
    return http.delete(`/plans/${id}`);
  },
};
