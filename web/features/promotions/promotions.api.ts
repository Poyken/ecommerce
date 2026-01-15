/**
 * Promotions API Client
 *
 * Sử dụng http() utility để:
 * - Tự động gắn auth headers (Bearer token)
 * - Tự động gắn CSRF token cho POST/PUT/DELETE
 * - Tự động refresh token khi 401
 * - Error handling thống nhất
 */

import { http } from "@/lib/http";
import { PaginatedData } from "@/types/api";
import {
  CreatePromotionDto,
  Promotion,
  UpdatePromotionDto,
  PromotionValidationResult,
} from "./types";

interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const promotionsApi = {
  /**
   * Lấy danh sách khuyến mãi (Admin)
   */
  findAll: async (
    params?: ListQueryParams
  ): Promise<PaginatedData<Promotion>> => {
    return http<PaginatedData<Promotion>>("/promotions", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Lấy chi tiết một khuyến mãi
   */
  findOne: async (id: string): Promise<Promotion> => {
    const response = await http<{ data: Promotion }>(`/promotions/${id}`);
    return response.data;
  },

  /**
   * Tạo khuyến mãi mới
   */
  create: async (data: CreatePromotionDto): Promise<Promotion> => {
    const response = await http<{ data: Promotion }>("/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Cập nhật khuyến mãi
   */
  update: async (id: string, data: UpdatePromotionDto): Promise<Promotion> => {
    const response = await http<{ data: Promotion }>(`/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Bật/Tắt trạng thái khuyến mãi
   */
  toggleActive: async (id: string): Promise<Promotion> => {
    const response = await http<{ data: Promotion }>(
      `/promotions/${id}/toggle`,
      {
        method: "PATCH",
      }
    );
    return response.data;
  },

  /**
   * Xóa khuyến mãi
   */
  delete: async (id: string): Promise<void> => {
    await http(`/promotions/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Validate mã khuyến mãi (cho checkout)
   */
  validate: async (
    code: string,
    totalAmount: number,
    items?: { skuId: string; quantity: number; price: number }[]
  ): Promise<PromotionValidationResult> => {
    return http<PromotionValidationResult>("/promotions/validate", {
      method: "POST",
      body: JSON.stringify({ code, totalAmount, items }),
    });
  },

  /**
   * Lấy danh sách khuyến mãi khả dụng (cho storefront)
   */
  getAvailable: async (totalAmount?: number): Promise<Promotion[]> => {
    return http<Promotion[]>("/promotions/available", {
      params: totalAmount ? { totalAmount } : undefined,
      skipAuth: true, // Public API - không cần auth
    });
  },

  /**
   * Lấy thống kê sử dụng khuyến mãi
   */
  getStats: async (id: string) => {
    return http<{
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
