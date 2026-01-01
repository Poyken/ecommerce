"use server";

import { http } from "@/lib/http";
import { Coupon } from "@/types/models";

/**
 * =====================================================================
 * COUPON SERVER ACTION
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Action này đóng vai trò Wrapper gọi API `/coupons/validate`.
 * - Nó xử lý việc catch lỗi từ API và trả về format chuẩn mà UI component (CheckoutForm) cần để hiển thị (isValid, discountAmount).
 * =====================================================================
 */
export async function validateCouponAction(code: string, amount: number) {
  try {
    const res = await http<{
      data: {
        isValid: boolean;
        discountAmount: number;
        coupon?: Coupon;
        message?: string;
      };
    }>(`/coupons/validate?code=${code}&amount=${amount}`);

    return {
      success: true,
      isValid: res.data.isValid,
      discountAmount: res.data.discountAmount,
      message: res.data.message,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid coupon code",
      message: error instanceof Error ? error.message : "Invalid coupon code",
      isValid: false,
      discountAmount: 0,
    };
  }
}
