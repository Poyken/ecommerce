/**
 * =====================================================================
 * WISHLIST BADGE - Huy hiệu hiển thị số lượng sản phẩm yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID SYNC:
 * - Nếu user chưa đăng nhập: Lấy số lượng từ `useGuestWishlist` (LocalStorage).
 * - Nếu user đã đăng nhập: Gọi Server Action `getWishlistCountAction` để lấy dữ liệu từ database.
 *
 * 2. REAL-TIME EVENTS:
 * - Lắng nghe các event `wishlist_updated` và `guest_wishlist_updated` để cập nhật con số ngay lập tức khi user nhấn nút Tim.
 * =====================================================================
 */

"use client";

import { getWishlistCountAction } from "@/actions/wishlist";
import { useGuestWishlist } from "@/hooks/use-guest-wishlist";
import { useEffect, useRef, useState } from "react";

interface WishlistBadgeProps {
  initialUser?: any;
  initialCount?: number;
}

export function WishlistBadge({
  initialUser,
  initialCount,
}: WishlistBadgeProps) {
  const [count, setCount] = useState(initialCount || 0);
  const isFetching = useRef(false);
  const initialized = useRef(initialCount !== undefined);
  const guestWishlist = useGuestWishlist();

  useEffect(() => {
    // Case 1: Guest Sync
    if (!initialUser) {
      setCount(guestWishlist.wishlistIds.length);
      return;
    }

    // Case 2: User Sync
    const fetchCount = async (initial = false) => {
      if (isFetching.current) return;

      // If we already have a count from server, and it's the first client run,
      // we can skip the fetch to save a request.
      // BUT if count is 0, we fetch once anyway to be sure (in case server missed sync)
      if (initial && count > 0) return;

      try {
        isFetching.current = true;
        const countValue = await getWishlistCountAction();
        setCount(countValue);
      } catch (error) {
        console.error("Failed to fetch wishlist count", error);
      } finally {
        isFetching.current = false;
      }
    };

    fetchCount(true); // First run check

    const handleUpdate = () => fetchCount();
    window.addEventListener("wishlist_updated", handleUpdate);
    window.addEventListener("guest_wishlist_updated", handleUpdate);

    return () => {
      window.removeEventListener("wishlist_updated", handleUpdate);
      window.removeEventListener("guest_wishlist_updated", handleUpdate);
    };
  }, [initialUser?.id]); // Re-run if user changes

  // Sync with guest list length in real-time
  useEffect(() => {
    if (!initialUser) {
      setCount(guestWishlist.wishlistIds.length);
    }
  }, [guestWishlist.wishlistIds.length, !!initialUser]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full pointer-events-none z-10 shadow-sm">
      {count}
    </span>
  );
}
