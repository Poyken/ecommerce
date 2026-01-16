import { http } from "@/lib/http";

/**
 * =====================================================================
 * MARKETING SERVICE - Domain logic for marketing
 * =====================================================================
 */

export const marketingService = {
  subscribeNewsletter: async (email: string) => {
    return http.post("/api/v1/newsletter/subscribe", { email });
  },
};
