/**
 * =====================================================================
 * COUPONS SERVER ACTIONS - Quản lý danh sách mã giảm giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các actions liên quan đến việc lấy danh sách mã giảm giá.
 * Khác với `coupon.ts` (dùng để validate), file này tập trung vào việc
 * hiển thị các mã giảm giá có sẵn cho người dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Conversion Rate: Khuyến khích khách hàng chốt đơn nhanh hơn bằng cách hiển thị các mã giảm giá hấp dẫn ngay tại giỏ hàng.
 * - Loyalty Marketing: Tích hợp logic kiểm tra mã giảm giá (Validate) để đảm bảo chỉ những khách hàng thân thiết hoặc đạt điều kiện mới được hưởng ưu đãi.

 * =====================================================================
 */

"use server";

import { couponService } from "./services/coupon.service";
import { wrapServerAction } from "@/lib/safe-action";
import { ActionResult } from "@/types/api";
import { Coupon } from "@/types/models";

/**
 * Láy danh sách các mã giảm giá đang khả dụng (chưa hết hạn, còn lượt dùng).
 */
export async function getAvailableCouponsAction(): Promise<
  ActionResult<Coupon[]>
> {
  return wrapServerAction(
    () => couponService.getAvailableCoupons(),
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
    const res = await couponService.validateCoupon(code, amount);

    return {
      isValid: res.data.isValid,
      discountAmount: res.data.discountAmount,
      message: res.data.message,
    };
  }, "Mã giảm giá không hợp lệ");
}
