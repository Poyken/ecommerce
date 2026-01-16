import { http } from "@/lib/http";
import { PaginatedData } from "@/types/api";
import {
  CreatePromotionDto,
  Promotion,
  UpdatePromotionDto,
  PromotionValidationResult,
} from "../types";

/**
 * =====================================================================
 * PROMOTION SERVICE - Domain logic for promotions
 * =====================================================================
 */

interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const promotionService = {
  /**
   * Lấy danh sách khuyến mãi (Admin)
   */
  findAll: async (
    params?: ListQueryParams
  ): Promise<PaginatedData<Promotion>> => {
    return http.get<PaginatedData<Promotion>>("/promotions", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Lấy chi tiết một khuyến mãi
   */
  findOne: async (id: string): Promise<Promotion> => {
    const response = await http.get<{ data: Promotion }>(`/promotions/${id}`);
    return response.data;
  },

  /**
   * Tạo khuyến mãi mới
   */
  create: async (data: CreatePromotionDto): Promise<Promotion> => {
    const response = await http.post<{ data: Promotion }>("/promotions", data);
    return response.data;
  },

  /**
   * Cập nhật khuyến mãi
   */
  update: async (id: string, data: UpdatePromotionDto): Promise<Promotion> => {
    const response = await http.put<{ data: Promotion }>(
      `/promotions/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Bật/Tắt trạng thái khuyến mãi
   */
  toggleActive: async (id: string): Promise<Promotion> => {
    const response = await http.patch<{ data: Promotion }>(
      `/promotions/${id}/toggle`
    );
    return response.data;
  },

  /**
   * Xóa khuyến mãi
   */
  delete: async (id: string): Promise<void> => {
    await http.delete(`/promotions/${id}`);
  },

  /**
   * Validate mã khuyến mãi (cho checkout)
   */
  validate: async (
    code: string,
    totalAmount: number,
    items?: { skuId: string; quantity: number; price: number }[]
  ): Promise<PromotionValidationResult> => {
    return http.post<PromotionValidationResult>("/promotions/validate", {
      code,
      totalAmount,
      items,
    });
  },

  /**
   * Lấy danh sách khuyến mãi khả dụng (cho storefront)
   */
  getAvailable: async (totalAmount?: number): Promise<Promotion[]> => {
    return http.get<Promotion[]>("/promotions/available", {
      params: totalAmount ? { totalAmount } : undefined,
      skipAuth: true,
    });
  },

  /**
   * Lấy thống kê sử dụng khuyến mãi
   */
  getStats: async (id: string) => {
    return http.get<{
      promotion: Promotion;
      stats: {
        totalUsages: number;
        totalDiscount: number;
        totalOrderAmount: number;
        remainingUsages: number | string;
        averageDiscount: number;
      };
    }>(`/promotions/${id}/stats`);
  },
};
