import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { User } from "@/types/models";

/**
 * =====================================================================
 * PROFILE SERVICE - Domain logic for user profile
 * =====================================================================
 */

export const profileService = {
  /**
   * Get current user profile
   */
  getProfile: async () => {
    return http.get<ApiResponse<User>>("/auth/me", {
      cache: "no-store",
      skipRedirectOn401: true,
    });
  },

  /**
   * Update user profile (supports FormData for avatar upload or JSON for text updates)
   */
  updateProfile: async (data: FormData | Record<string, any>) => {
    // If FormData, let the browser set Content-Type
    if (data instanceof FormData) {
      return http.patch("/auth/me", data);
    }
    // Else send as JSON
    return http.patch("/auth/me", data);
  },

  /**
   * Generate 2FA Secret & QR Code
   */
  generateTwoFactor: async () => {
    return http.post<ApiResponse<{ secret: string; qrCode: string }>>(
      "/auth/2fa/generate"
    );
  },

  /**
   * Enable 2FA
   */
  enableTwoFactor: async (token: string, secret: string) => {
    return http.post("/auth/2fa/enable", { token, secret });
  },

  /**
   * Disable 2FA
   */
  disableTwoFactor: async (token: string) => {
    return http.post("/auth/2fa/disable", { token });
  },
};
