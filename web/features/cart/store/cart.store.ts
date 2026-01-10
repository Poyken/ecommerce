/**
 * =====================================================================
 * CART STORE - Quản lý giỏ hàng tập trung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERSISTENT COUNT:
 * - Lưu trữ số lượng item trong giỏ hàng để hiển thị badge ở Header.
 * - Hạn chế việc gọi API đếm liên tục bằng cách giữ state trong RAM.
 *
 * 2. HYBRID LOGIC (Guest vs Auth):
 * - Store chỉ lưu `count`, việc quyết định lấy count từ Database hay LocalStorage (Guest) được điều phối bởi `CartInitializer`.
 *
 * 3. REACTIVE UI:
 * - Khi gọi `increment`/`decrement`, UI sẽ cập nhật ngay lập tức giúp App cảm giác mượt mà (snappy).
 * =====================================================================
 */

import { getCartCountAction } from "@/features/cart/actions";
import { create } from "zustand";

interface CartState {
  count: number;
  isFetching: boolean;
  refreshCart: () => Promise<void>;
  updateCount: (newCount: number) => void;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
  setFetching: (isFetching: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  isFetching: false,

  setFetching: (isFetching) => set({ isFetching }),

  updateCount: (newCount) => set({ count: newCount }),

  increment: (amount = 1) => set((state) => ({ count: state.count + amount })),

  decrement: (amount = 1) =>
    set((state) => ({ count: Math.max(0, state.count - amount) })),

  refreshCart: async () => {
    // We can't easily check for user auth here without passing it in or using another store/cookie check
    // Logic will be handled by the caller or the Initializer which has context
    // For now, simpler refresh logic that mimics the Provider's fetchCount but simplified
    // This action is mainly for manual trigger

    // In strict architecture, we might pass user state or handle this in a Thunk.
    // Given the hybrid nature (guest vs auth), the Initializer is the best place to orchestrate the "Source of Truth"
    // and just use store.updateCount().

    // However, to keep API compatible with useCartContext:
    try {
      set({ isFetching: true });
      // Attempt server fetch (will fail/return 0 if not auth, handled by implementation)
      const result = await getCartCountAction();
      if (
        result.success &&
        result.data &&
        typeof result.data.totalItems === "number"
      ) {
        set({ count: result.data.totalItems });
      } else {
        // Fallback to guest logic if server action implies guest?
        // Actually getCartCountAction usually returns 0 if guest.
        // The Provider had specific logic for "If User -> Action, If Guest -> LocalStorage".
        // We'll move that specific logic to the Initializer or a helper.
      }
    } catch (e) {
      console.error("Failed to refresh cart", e);
    } finally {
      set({ isFetching: false });
    }
  },
}));
