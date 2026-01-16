import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/schemas";

/**
 * =====================================================================
 * AUTH SERVICE - API interactions for authentication
 * =====================================================================
 */

export const authService = {
  /**
   * Login with email and password
   */
  login: async (data: z.infer<typeof loginSchema>) => {
    return http.post<
      ApiResponse<{
        accessToken?: string;
        refreshToken?: string;
        mfaRequired?: boolean;
        userId?: string;
      }>
    >("/auth/login", data, { skipRedirectOn401: true });
  },

  /**
   * Login with 2FA
   */
  login2FA: async (userId: string, token: string) => {
    return http.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >("/auth/2fa/login", { userId, token }, { skipRedirectOn401: true });
  },

  /**
   * Register new account
   */
  register: async (data: z.infer<typeof registerSchema>) => {
    return http.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >("/auth/register", data);
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: z.infer<typeof forgotPasswordSchema>) => {
    return http.post("/auth/forgot-password", data);
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: { token: string; newPassword: string }) => {
    return http.post("/auth/reset-password", data);
  },
};
