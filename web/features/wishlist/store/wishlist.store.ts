/**
 * =====================================================================
 * WISHLIST STORE - Quản lý danh sách yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CENTRALIZED STATE:
 * - Quản lý số lượng sản phẩm user đã thả tim.
 * - Giảm thiểu việc props drilling (truyền data qua nhiều cấp component).
 *
 * 2. SIMPLE SYNC:
 * - `refreshWishlist` cho phép đồng bộ lại với Database khi cần thiết.
 * =====================================================================
 */

import { getWishlistCountAction } from "@/features/wishlist/actions";
import { create } from "zustand";

interface WishlistState {
  count: number;
  isFetching: boolean;
  refreshWishlist: () => Promise<void>;
  updateCount: (newCount: number) => void;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
  setFetching: (isFetching: boolean) => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  count: 0,
  isFetching: false,

  setFetching: (isFetching) => set({ isFetching }),

  updateCount: (newCount) => set({ count: newCount }),

  increment: (amount = 1) => set((state) => ({ count: state.count + amount })),

  decrement: (amount = 1) =>
    set((state) => ({ count: Math.max(0, state.count - amount) })),

  refreshWishlist: async () => {
    try {
      set({ isFetching: true });
      const count = await getWishlistCountAction();
      set({ count });
    } catch (e) {
      console.error("Failed to refresh wishlist", e);
    } finally {
      set({ isFetching: false });
    }
  },
}));
