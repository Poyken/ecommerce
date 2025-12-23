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
import { ApiResponse } from "@/types/dtos";
import { Coupon } from "@/types/models";

/**
 * Lấy danh sách các mã giảm giá đang khả dụng (chưa hết hạn, còn lượt dùng).
 */
export async function getAvailableCouponsAction() {
  try {
    const res = await http<ApiResponse<Coupon[]>>("/coupons/available");
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}
