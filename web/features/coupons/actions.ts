

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
