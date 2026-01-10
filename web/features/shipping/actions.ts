/**
 * =====================================================================
 * SHIPPING SERVER ACTIONS - Quản lý vận chuyển (GHN/GHTK)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các actions để lấy dữ liệu hành chính (Tỉnh/Huyện/Xã)
 * và tính toán phí vận chuyển.
 *
 * CÁC TÍNH NĂNG CHÍNH:
 * 1. Lấy danh sách Tỉnh/Thành phố.
 * 2. Lấy danh sách Quận/Huyện dựa trên Tỉnh.
 * 3. Lấy danh sách Phường/Xã dựa trên Huyện.
 * 4. Tính toán phí ship dựa trên địa chỉ nhận hàng.
 *
 * ⚠️ LƯU Ý: Dữ liệu này thường được lấy từ các đơn vị vận chuyển (như GHN).
 * =====================================================================
 */

"use server";

import {
  MOCK_DISTRICTS,
  MOCK_PROVINCES,
  MOCK_WARDS,
} from "@/lib/constants/vn-locations";
import { http } from "@/lib/http";
import { wrapServerAction } from "@/lib/safe-action";
import { ApiResponse, ActionResult } from "@/types/api";

/**
 * Interface cho Tỉnh/Thành phố.
 */
export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

/**
 * Interface cho Quận/Huyện.
 */
export interface District {
  DistrictID: number;
  DistrictName: string;
}

/**
 * Interface cho Phường/Xã.
 */
export interface Ward {
  WardCode: string;
  WardName: string;
}

/**
 * Lấy danh sách tất cả Tỉnh/Thành phố tại Việt Nam.
 */
export async function getProvinces(): Promise<ActionResult<Province[]>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Province[]>>("/shipping/provinces", {
      skipAuth: true,
    });
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
    const res = await http<ApiResponse<District[]>>(
      `/shipping/districts/${provinceId}`,
      { skipAuth: true }
    );
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
    const res = await http<ApiResponse<Ward[]>>(
      `/shipping/wards/${districtId}`,
      { skipAuth: true }
    );
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
    const res = await http<number>("/shipping/fee", {
      method: "POST",
      body: JSON.stringify({ districtId, wardCode }),
      skipAuth: true,
    });
    return Number(res) || 0;
  }, "Failed to calculate shipping fee");
}
