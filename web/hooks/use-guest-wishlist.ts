"use client";

/**
 * =====================================================================
 * USE GUEST WISHLIST HOOK - Quản lý danh sách yêu thích cho khách
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LOCAL STORAGE PERSISTENCE:
 * - Lưu danh sách ID sản phẩm yêu thích vào `localStorage` dưới key `guest_wishlist`.
 * - Giúp khách hàng vẫn có thể lưu sản phẩm yêu thích mà không cần đăng ký tài khoản.
 *
 * 2. CROSS-TAB SYNC:
 * - Sử dụng `window.addEventListener("guest_wishlist_updated", ...)` để đồng bộ dữ liệu giữa các tab.
 * - Khi một tab thêm/xóa sản phẩm, các tab khác sẽ tự động cập nhật UI.
 *
 * 3. EVENT DISPATCHING:
 * - Dispatch cả `guest_wishlist_updated` và `wishlist_updated` để đảm bảo tương thích với các component khác nhau.
 *
 * 4. PERFORMANCE OPTIMIZATIONS:
 * - useCallback cho tất cả functions để stabilize references
 * - Tránh re-render các components consumer
 * =====================================================================
 */

import { useCallback, useEffect, useState } from "react";

export function useGuestWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("guest_wishlist");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    // Listen for updates
    const handleUpdate = () => {
      const stored = localStorage.getItem("guest_wishlist");
      if (stored) {
        try {
          setWishlistIds(JSON.parse(stored));
        } catch {
          setWishlistIds([]);
        }
      } else {
        setWishlistIds([]);
      }
    };

    window.addEventListener("guest_wishlist_updated", handleUpdate);
    return () =>
      window.removeEventListener("guest_wishlist_updated", handleUpdate);
  }, []);

  const addToWishlist = useCallback((productId: string) => {
    setWishlistIds((current) => {
      if (current.includes(productId)) return current;
      const updated = [...current, productId];
      localStorage.setItem("guest_wishlist", JSON.stringify(updated));
      // Dispatch events after state update
      setTimeout(() => {
        window.dispatchEvent(new Event("guest_wishlist_updated"));
        window.dispatchEvent(new Event("wishlist_updated"));
      }, 0);
      return updated;
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistIds((current) => {
      const updated = current.filter((id) => id !== productId);
      localStorage.setItem("guest_wishlist", JSON.stringify(updated));
      // Dispatch events after state update
      setTimeout(() => {
        window.dispatchEvent(new Event("guest_wishlist_updated"));
        window.dispatchEvent(new Event("wishlist_updated"));
      }, 0);
      return updated;
    });
  }, []);

  const hasItem = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  return { wishlistIds, addToWishlist, removeFromWishlist, hasItem };
}
