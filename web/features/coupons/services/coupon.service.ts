import { http } from "@/lib/http";
import { ApiResponse } from "@/types/api";
import { Coupon } from "@/types/models";

/**
 * =====================================================================
 * COUPON SERVICE - Domain logic for coupons
 * =====================================================================
 */

export const couponService = {
  getAvailableCoupons: async () => {
    return http.get<ApiResponse<Coupon[]>>("/coupons/available", {
      skipAuth: true,
    });
  },

  validateCoupon: async (code: string, amount: number) => {
    return http.get<
      ApiResponse<{
        isValid: boolean;
        discountAmount: number;
        message?: string;
      }>
    >(`/coupons/validate?code=${code}&amount=${amount}`);
  },
};
