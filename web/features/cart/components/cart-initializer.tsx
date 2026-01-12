/**
 * =====================================================================
 * CART INITIALIZER - Đồng bộ giỏ hàng đa nền tảng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA HYDRATION:
 * - Khi Server trả về `initialCount` (từ SEO/Server Components), ta "bơm" ngay vào store để user thấy số ngay, không chờ JS load xong mới fetch.
 *
 * 2. CROSS-TAB SYNC:
 * - Lắng nghe event `storage` để khi User mở tab mới và add cart, tab hiện tại cũng tự nhảy số.
 *
 * 3. GUEST CART INTEGRATION:
 * - Trực tiếp đọc `localStorage` nếu chưa login, đảm bảo trải nghiệm mua hàng không bị gián đoạn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { getCartCountAction } from "@/features/cart/actions";
import { useCartStore } from "@/features/cart/store/cart.store";
import { User } from "@/types/models";
import { useCallback, useEffect, useRef } from "react";

interface CartInitializerProps {
  initialUser?: User | null;
  initialCount?: number;
}

export function CartInitializer({
  initialUser,
  initialCount,
}: CartInitializerProps) {
  const { updateCount, setFetching } = useCartStore();
  const isFetchingRef = useRef(false);

  // Hydrate initial count if provided
  useEffect(() => {
    if (typeof initialCount === "number") {
      updateCount(initialCount);
    }
  }, [initialCount, updateCount]);

  const fetchCount = useCallback(async () => {
    if (isFetchingRef.current) return;

    // 1. Logged in user -> API
    if (initialUser) {
      try {
        isFetchingRef.current = true;
        setFetching(true);
        const result = await getCartCountAction();
        if (
          result.success &&
          result.data &&
          typeof result.data.totalItems === "number"
        ) {
          updateCount(result.data.totalItems);
        } else {
          updateCount(0);
        }
      } catch {
        updateCount(0);
      } finally {
        isFetchingRef.current = false;
        setFetching(false);
      }
      return;
    }

    // 2. Guest user -> LocalStorage
    try {
      const guestCart = localStorage.getItem("guest_cart");
      if (guestCart) {
        const items = JSON.parse(guestCart);
        const totalQuantity = Array.isArray(items)
          ? items.reduce(
              (sum: number, item: { quantity?: number }) =>
                sum + (item.quantity || 0),
              0
            )
          : 0;
        updateCount(totalQuantity);
      } else {
        updateCount(0);
      }
    } catch {
      updateCount(0);
    }
  }, [initialUser, updateCount, setFetching]);

  useEffect(() => {
    // Initial fetch
    fetchCount();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guest_cart") fetchCount();
    };

    const handleGuestUpdate = () => fetchCount();
    const handleCartUpdate = () => fetchCount();
    const handleCartClear = () => updateCount(0);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("guest_cart_updated", handleGuestUpdate);
    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("cart_clear", handleCartClear);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("guest_cart_updated", handleGuestUpdate);
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("cart_clear", handleCartClear);
    };
  }, [fetchCount, updateCount]);

  return null;
}
