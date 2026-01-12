import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Contact
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STREAMING SSR & SUSPENSE:
 * - File `loading.tsx` này sẽ tự động được Next.js bọc quanh `page.tsx` bằng `<Suspense>`.
 * - Trong khi Server đang fetch dữ liệu Contact, Client sẽ hiển thị Skeleton này NGAY LẬP TỨC.
 * - Giúp giảm TTFB (Time to First Byte) và tăng trải nghiệm người dùng.
 *
 * UPDATE: Sử dụng LoadingScreen để đồng bộ trải nghiệm loading với Admin/Auth.
 * =====================================================================
 */

export default function Loading() {
  return <LoadingScreen fullScreen={false} className="min-h-screen" />;
}
