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
 * =====================================================================
 */

import { useEffect, useState } from "react";

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

  const addToWishlist = (productId: string) => {
    const current = [...wishlistIds];
    if (!current.includes(productId)) {
      current.push(productId);
      localStorage.setItem("guest_wishlist", JSON.stringify(current));
      setWishlistIds(current);
      window.dispatchEvent(new Event("guest_wishlist_updated"));
      window.dispatchEvent(new Event("wishlist_updated")); // For badge compatibility
    }
  };

  const removeFromWishlist = (productId: string) => {
    const current = wishlistIds.filter((id) => id !== productId);
    localStorage.setItem("guest_wishlist", JSON.stringify(current));
    setWishlistIds(current);
    window.dispatchEvent(new Event("guest_wishlist_updated"));
    window.dispatchEvent(new Event("wishlist_updated"));
  };

  const hasItem = (productId: string) => wishlistIds.includes(productId);

  return { wishlistIds, addToWishlist, removeFromWishlist, hasItem };
}
