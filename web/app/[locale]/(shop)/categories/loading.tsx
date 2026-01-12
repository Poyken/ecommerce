import { CategoriesSkeleton } from "@/features/categories/components/skeletons/categories-skeleton";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Categories
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STREAMING SSR & SUSPENSE:
 * - File `loading.tsx` này sẽ tự động được Next.js bọc quanh `page.tsx` bằng `<Suspense>`.
 * - Trong khi Server đang fetch dữ liệu Category, Client sẽ hiển thị Skeleton này NGAY LẬP TỨC.
 * - Giúp giảm TTFB (Time to First Byte) và tăng trải nghiệm người dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

export default function Loading() {
  return <CategoriesSkeleton />;
}
