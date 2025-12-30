/**
 * =====================================================================
 * COUPON VALIDATION ACTION - Kiểm tra mã giảm giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Action này dùng để kiểm tra tính hợp lệ của một mã giảm giá (Coupon)
 * dựa trên mã code và tổng giá trị đơn hàng hiện tại.
 *
 * QUY TRÌNH XỬ LÝ:
 * 1. Nhận mã code và số tiền (amount).
 * 2. Gọi API Backend `/coupons/validate`.
 * 3. Trả về kết quả: có hợp lệ không, số tiền được giảm là bao nhiêu.
 *
 * ⚠️ LƯU Ý: Việc tính toán số tiền giảm giá cuối cùng vẫn do Backend quyết định
 * để đảm bảo tính chính xác và bảo mật.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Coupon } from "@/types/models";

/**
 * Kiểm tra mã giảm giá có hợp lệ không.
 *
 * @param code - Mã giảm giá người dùng nhập
 * @param amount - Tổng giá trị đơn hàng trước khi giảm
 */
export async function validateCouponAction(code: string, amount: number) {
  try {
    const res = await http<
      ApiResponse<{
        isValid: boolean;
        discountAmount: number;
        coupon?: Coupon;
        message?: string;
      }>
    >(`/coupons/validate?code=${code}&amount=${amount}`);

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

/**
 * [P17 PARITY] Lấy danh sách các mã giảm giá công khai đang khả dụng.
 * Giúp người dùng dễ dàng chọn mã mà không cần nhớ code.
 */
export async function getAvailableCouponsAction() {
  try {
    const res = await http<ApiResponse<Coupon[]>>("/coupons/available", {
      skipAuth: true, // Ai cũng có thể xem danh sách khuyến mãi
    });
    return { success: true, data: res.data || [] };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch coupons",
    };
  }
}
