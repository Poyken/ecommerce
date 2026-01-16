import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Product } from "@/types/models";

/**
 * =====================================================================
 * WISHLIST SERVICE - Domain logic for wishlist
 * =====================================================================
 */

export const wishlistService = {
  /**
   * Toggle wishlist status for a product
   */
  toggleWishlist: async (productId: string) => {
    return http.post<ApiResponse<{ isWishlisted: boolean }>>(
      "/wishlist/toggle",
      { productId },
      { skipRedirectOn401: true }
    );
  },

  /**
   * Merge guest wishlist into user account
   */
  mergeGuestWishlist: async (productIds: string[]) => {
    return http.post<ApiResponse<Product[]>>("/wishlist/merge", { productIds });
  },

  /**
   * Get user's wishlist
   */
  getWishlist: async () => {
    return http.get<ApiResponse<Product[]>>("/wishlist", {
      skipRedirectOn401: true,
    });
  },

  /**
   * Check wishlist status for a specific product
   */
  checkWishlistStatus: async (productId: string) => {
    return http.get<ApiResponse<{ isWishlisted: boolean }>>(
      `/wishlist/check?productId=${productId}`
    );
  },

  /**
   * Get wishlist count
   */
  getWishlistCount: async () => {
    return http.get<ApiResponse<{ count: number }>>("/wishlist/count");
  },

  /**
   * Get product details for guest wishlist
   */
  getGuestWishlistDetails: async (productIds: string[]) => {
    return http.get<ApiResponse<Product[]>>("/products", {
      params: {
        ids: productIds.join(","),
        includeSkus: true,
        limit: 50,
      },
    });
  },
};
