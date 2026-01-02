import { WishlistSkeleton } from "@/components/shared/skeletons/wishlist-skeleton";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Wishlist
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STREAMING SSR & SUSPENSE:
 * - File `loading.tsx` này sẽ tự động được Next.js bọc quanh `page.tsx` bằng `<Suspense>`.
 * - Trong khi Server đang fetch dữ liệu Wishlist, Client sẽ hiển thị Skeleton này NGAY LẬP TỨC.
 * - Giúp giảm TTFB (Time to First Byte) và tăng trải nghiệm người dùng.
 * =====================================================================
 */

export default function Loading() {
  return <WishlistSkeleton />;
}
