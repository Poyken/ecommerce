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
 *
 * 3. PERFORMANCE:
 * - React.memo để prevent unnecessary re-renders
 * - useCallback để stabilize event handlers
 * =====================================================================
 */

"use client";

import { getWishlistCountAction } from "@/actions/wishlist";
import { useGuestWishlist } from "@/hooks/use-guest-wishlist";
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface WishlistBadgeProps {
  initialUser?: unknown;
  initialCount?: number;
}

export const WishlistBadge = memo(function WishlistBadge({
  initialUser,
  initialCount,
}: WishlistBadgeProps) {
  const [count, setCount] = useState(initialCount || 0);
  const isFetching = useRef(false);
  const { wishlistIds } = useGuestWishlist();

  const fetchCount = useCallback(async () => {
    if (isFetching.current || !initialUser) return;

    try {
      isFetching.current = true;
      const countValue = await getWishlistCountAction();
      setCount(countValue);
    } catch (error) {
      console.error("Failed to fetch wishlist count", error);
    } finally {
      isFetching.current = false;
    }
  }, [initialUser]);

  // Sync with guest wishlist for guest users
  useEffect(() => {
    if (!initialUser) {
      setCount(wishlistIds.length);
    }
  }, [wishlistIds.length, initialUser]);

  // Fetch and listen for updates for logged-in users
  useEffect(() => {
    if (!initialUser) return;

    // Initial fetch only if we don't have a count
    if (count === 0 || initialCount === undefined) {
      fetchCount();
    }

    const handleUpdate = () => fetchCount();
    window.addEventListener("wishlist_updated", handleUpdate);
    window.addEventListener("guest_wishlist_updated", handleUpdate);

    return () => {
      window.removeEventListener("wishlist_updated", handleUpdate);
      window.removeEventListener("guest_wishlist_updated", handleUpdate);
    };
  }, [initialUser, fetchCount, count, initialCount]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full pointer-events-none z-10 shadow-sm">
      {count}
    </span>
  );
});
