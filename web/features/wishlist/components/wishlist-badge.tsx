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

import { useGuestWishlist } from "@/features/wishlist/hooks/use-guest-wishlist";
import { useWishlistStore } from "@/features/wishlist/store/wishlist.store";
import { memo, useEffect } from "react";

interface WishlistBadgeProps {
  initialUser?: unknown;
  initialCount?: number;
}

export const WishlistBadge = memo(function WishlistBadge({
  initialUser,
  initialCount,
}: WishlistBadgeProps) {
  const { count, updateCount, refreshWishlist } = useWishlistStore();
  const { wishlistIds } = useGuestWishlist();

  // Initial sync from props
  useEffect(() => {
    if (initialCount !== undefined) {
      updateCount(initialCount);
    }
  }, [initialCount, updateCount]);

  // Sync with guest wishlist
  useEffect(() => {
    if (!initialUser) {
      updateCount(wishlistIds.length);
    }
  }, [wishlistIds.length, initialUser, updateCount]);

  // Sync with server for logged-in users and listen for events
  useEffect(() => {
    if (!initialUser) return;
    
    // Only fetch if explicitly needed or to sync listeners
    // We can also just listen to window events if we want to keep that pattern
    // or rely on the store's state if updated by `WishlistButton`
    
    const handleUpdate = () => refreshWishlist();
    window.addEventListener("wishlist_updated", handleUpdate);
    window.addEventListener("guest_wishlist_updated", handleUpdate);

    return () => {
      window.removeEventListener("wishlist_updated", handleUpdate);
      window.removeEventListener("guest_wishlist_updated", handleUpdate);
    };
  }, [initialUser, refreshWishlist]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full pointer-events-none z-10 shadow-sm">
      {count}
    </span>
  );
});
