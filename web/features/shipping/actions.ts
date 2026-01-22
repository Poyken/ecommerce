

"use server";

import { MOCK_DISTRICTS, MOCK_PROVINCES, MOCK_WARDS } from "./mock-data";
import { wrapServerAction } from "@/lib/safe-action";
import { ActionResult } from "@/types/api";
import { shippingService } from "./services/shipping.service";
import type {
  Province,
  District,
  Ward,
} from "./services/shipping.service";

export type { Province, District, Ward };

/**
 * Lấy danh sách tất cả Tỉnh/Thành phố tại Việt Nam.
 */
export async function getProvinces(): Promise<ActionResult<Province[]>> {
  return wrapServerAction(async () => {
    const res = await shippingService.getProvinces();
    // Fallback to mock data if API returns empty
    if (!res.data || res.data.length === 0) {
      return MOCK_PROVINCES;
    }
    return res.data;
  }, "Using Mock Data for Provinces");
}

/**
 * Lấy danh sách Quận/Huyện thuộc một Tỉnh.
 *
 * @param provinceId - ID của Tỉnh/Thành phố
 */
export async function getDistricts(
  provinceId: number
): Promise<ActionResult<District[]>> {
  if (!provinceId) return { success: true, data: [] };
  return wrapServerAction(async () => {
    const res = await shippingService.getDistricts(provinceId);
    if (!res.data || res.data.length === 0) {
      return MOCK_DISTRICTS.filter((d) => d.ProvinceID === provinceId);
    }
    return res.data;
  }, "Failed to fetch districts");
}

/**
 * Lấy danh sách Phường/Xã thuộc một Quận/Huyện.
 *
 * @param districtId - ID của Quận/Huyện
 */
export async function getWards(
  districtId: number
): Promise<ActionResult<Ward[]>> {
  if (!districtId) return { success: true, data: [] };
  return wrapServerAction(async () => {
    const res = await shippingService.getWards(districtId);
    if (!res.data || res.data.length === 0) {
      return MOCK_WARDS.filter((w) => w.DistrictID === districtId);
    }
    return res.data;
  }, "Failed to fetch wards");
}

/**
 * Tính toán phí vận chuyển dự kiến.
 *
 * @param districtId - ID Quận/Huyện nhận hàng
 * @param wardCode - Mã Phường/Xã nhận hàng
 */
export async function calculateShippingFeeAction(
  districtId: number,
  wardCode: string
): Promise<ActionResult<number>> {
  return wrapServerAction(async () => {
    const res = await shippingService.calculateFee(districtId, wardCode);
    return Number(res.data) || 0;
  }, "Failed to calculate shipping fee");
}
