/**
 * =====================================================================
 * COUPONS SERVER ACTIONS - Quản lý danh sách mã giảm giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các actions liên quan đến việc lấy danh sách mã giảm giá.
 * Khác với `coupon.ts` (dùng để validate), file này tập trung vào việc
 * hiển thị các mã giảm giá có sẵn cho người dùng.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { wrapServerAction } from "@/lib/safe-action";
import { ActionResult, ApiResponse } from "@/types/api";
import { Coupon } from "@/types/models";

/**
 * Láy danh sách các mã giảm giá đang khả dụng (chưa hết hạn, còn lượt dùng).
 */
export async function getAvailableCouponsAction(): Promise<
  ActionResult<Coupon[]>
> {
  return wrapServerAction(
    () =>
      http<ApiResponse<Coupon[]>>("/coupons/available", {
        skipAuth: true,
      }),
    "Không thể lấy mã giảm giá"
  );
}

/**
 * Kiểm tra mã giảm giá có hợp lệ không.
 */
export async function validateCouponAction(
  code: string,
  amount: number
): Promise<
  ActionResult<{
    isValid: boolean;
    discountAmount: number;
    message?: string;
  }>
> {
  return wrapServerAction(async () => {
    const res = await http<
      ApiResponse<{
        isValid: boolean;
        discountAmount: number;
        message?: string;
      }>
    >(`/coupons/validate?code=${code}&amount=${amount}`);

    return {
      isValid: res.data.isValid,
      discountAmount: res.data.discountAmount,
      message: res.data.message,
    };
  }, "Mã giảm giá không hợp lệ");
}
