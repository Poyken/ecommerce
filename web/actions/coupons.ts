"use server";

import { http } from "@/lib/http";
import { Coupon } from "@/types/models";

/**
 * =====================================================================
 * COUPONS ACTIONS - Mã giảm giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER ACTION PROXY:
 * - Đây là ví dụ về một Action đơn giản chỉ đóng vai trò "cầu nối" (Proxy) gọi API.
 * - Tại sao vẫn cần nó? Để Frontend không phải hardcode URL API, tận dụng được cơ chế Cookie tự động của `http` lib, và type safety.
 * =====================================================================
 */

/**
 * Lấy danh sách mã giảm giá khả dụng.
 */
export async function getAvailableCouponsAction() {
  try {
    const res = await http<{ data: Coupon[] }>("/coupons/available");
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}
