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

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";

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
export async function getProvinces(): Promise<Province[]> {
  try {
    const res = await http<ApiResponse<Province[]>>("/shipping/provinces");
    return res.data || [];
  } catch (error) {
    console.error("Failed to fetch provinces:", error);
    return [];
  }
}

/**
 * Lấy danh sách Quận/Huyện thuộc một Tỉnh.
 *
 * @param provinceId - ID của Tỉnh/Thành phố
 */
export async function getDistricts(provinceId: number): Promise<District[]> {
  if (!provinceId) return [];
  try {
    const res = await http<ApiResponse<District[]>>(
      `/shipping/districts/${provinceId}`
    );
    return res.data || [];
  } catch (error) {
    console.error(
      `Failed to fetch districts for province ${provinceId}:`,
      error
    );
    return [];
  }
}

/**
 * Lấy danh sách Phường/Xã thuộc một Quận/Huyện.
 *
 * @param districtId - ID của Quận/Huyện
 */
export async function getWards(districtId: number): Promise<Ward[]> {
  if (!districtId) return [];
  try {
    const res = await http<ApiResponse<Ward[]>>(
      `/shipping/wards/${districtId}`
    );
    return res.data || [];
  } catch (error) {
    console.error(`Failed to fetch wards for district ${districtId}:`, error);
    return [];
  }
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
): Promise<number> {
  try {
    const res = await http<number>("/shipping/fee", {
      method: "POST",
      body: JSON.stringify({ districtId, wardCode }),
      skipAuth: true,
    });
    return Number(res) || 0;
  } catch (error) {
    console.error("Failed to calculate shipping fee:", error);
    return 30000; // Phí mặc định nếu có lỗi
  }
}
