import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Sku } from "@/types/models";
import { cache } from "react";

/**
 * =====================================================================
 * CART SERVICE - Domain logic for shopping cart
 * =====================================================================
 */

export const cartService = {
  /**
   * Get current cart count (authenticated)
   */
  getCartCount: cache(async () => {
    try {
      const response = await http.get<ApiResponse<{ totalItems: number }>>(
        "/cart",
        {
          skipRedirectOn401: true,
        }
      );
      return response.data.totalItems || 0;
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      return 0;
    }
  }),

  /**
   * Get product details for guest cart IDs
   */
  getGuestCartDetails: async (skuIds: string[]): Promise<Sku[]> => {
    if (!skuIds.length) return [];
    try {
      const response = await http.post<ApiResponse<Sku[]>>(
        "/products/skus/details",
        { skuIds }
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch guest cart details:", error);
      return [];
    }
  },

  /**
   * Add item to cart
   */
  addItem: async (skuId: string, quantity: number) => {
    return http.post("/cart", { skuId, quantity }, { skipRedirectOn401: true });
  },

  /**
   * Update item quantity
   */
  updateQuantity: async (itemId: string, quantity: number) => {
    return http.patch(
      `/cart/items/${itemId}`,
      { quantity },
      { skipRedirectOn401: true }
    );
  },

  /**
   * Remove item from cart
   */
  removeItem: async (itemId: string) => {
    return http.delete(`/cart/items/${itemId}`, { skipRedirectOn401: true });
  },

  /**
   * Clear entire cart
   */
  clearCart: async () => {
    return http.delete("/cart", { skipRedirectOn401: true });
  },

  /**
   * Merge guest cart items into authenticated user's cart
   */
  mergeGuestCart: async (items: { skuId: string; quantity: number }[]) => {
    return http.post<unknown[]>("/cart/merge", items);
  },

  /**
   * Get order details for reorder functionality
   */
  getOrderForReorder: async (orderId: string) => {
    return http.get<
      ApiResponse<{ items?: { skuId: string; quantity: number }[] }>
    >(`/orders/my-orders/${orderId}`);
  },

  /**
   * Get full cart data (Server Component)
   */
  getCart: async () => {
    return http.get<ApiResponse<import("@/types/models").Cart>>("/cart", {
      skipRedirectOn401: true,
    });
  },
};
