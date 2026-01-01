"use server";

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";

/**
 * =====================================================================
 * SHIPPING ACTIONS - Địa chính và Phí ship
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEPENDENT DROPDOWNS (Dropdown phụ thuộc):
 * - Client sẽ gọi tuần tự: Chọn Tỉnh -> Gọi `getDistricts` -> Chọn Huyện -> Gọi `getWards`.
 * - Các Action này gọi thẳng API proxy về, nhưng được viết tách biệt để Frontend code gọn hơn.
 *
 * 2. SERVER-SIDE CALCULATION:
 * - `calculateShippingFeeAction` tính phí ship. Logic thực tế phức tạp nên phải làm ở server (ẩn logic business), không tính ở Client JS để tránh bị sửa hack phí.
 * =====================================================================
 */

export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}
export interface District {
  DistrictID: number;
  DistrictName: string;
}
export interface Ward {
  WardCode: string;
  WardName: string;
}

export async function getProvinces(): Promise<Province[]> {
  try {
    const res = await http<ApiResponse<Province[]>>("/shipping/provinces");
    return res.data || [];
  } catch (error) {
    console.error("Failed to fetch provinces:", error);
    return [];
  }
}

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
    return 30000; // Fallback
  }
}
