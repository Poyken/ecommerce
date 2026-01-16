import { http } from "@/lib/http";

/**
 * =====================================================================
 * ADMIN FEATURE FLAG SERVICE - Domain logic for feature flags
 * =====================================================================
 */

export const featureFlagService = {
  /**
   * Get enabled feature flags for current user/tenant
   */
  getMyFlags: async () => {
    return http.get<string[]>("/feature-flags/my-flags", {
      skipAuth: true,
    });
  },
};
