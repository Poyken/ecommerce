import { http } from "@/lib/http";
import { ApiResponse } from "@/types/api";

/**
 * =====================================================================
 * SHIPPING SERVICE - Domain logic for shipping & location
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

export const shippingService = {
  getProvinces: async () => {
    return http.get<ApiResponse<Province[]>>("/shipping/provinces", {
      skipAuth: true,
    });
  },

  getDistricts: async (provinceId: number) => {
    return http.get<ApiResponse<District[]>>(
      `/shipping/districts/${provinceId}`,
      { skipAuth: true }
    );
  },

  getWards: async (districtId: number) => {
    return http.get<ApiResponse<Ward[]>>(`/shipping/wards/${districtId}`, {
      skipAuth: true,
    });
  },

  calculateFee: async (districtId: number, wardCode: string) => {
    return http.post<ApiResponse<number>>(
      "/shipping/fee",
      {
        districtId,
        wardCode,
      },
      { skipAuth: true }
    );
  },
};
