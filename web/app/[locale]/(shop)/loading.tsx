import { HomeSkeleton } from "@/features/home/components/skeletons/home-skeleton";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ mặc định cho (shop) group (Home Page)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NEXT.JS STREAMING:
 * - File `loading.tsx` tự động bao bọc các trang bên trong bằng `Suspense`.
 * - Khi dữ liệu đang được fetch ở Server Component, UI này sẽ hiển thị ngay lập tức.
 *
 * 2. SKELETON SCREENS:
 * - Thay vì dùng spinner xoay tròn, ta dùng `Skeleton` để giả lập layout của trang thật.
 * - Giúp người dùng hình dung được cấu trúc trang sắp hiện ra -> Cảm giác trang load nhanh hơn (Perceived performance).
 *
 * 3. LAYOUT MATCHING:
 * - Cấu trúc của `loading.tsx` nên khớp tối đa với `page.tsx` (Hero, Categories, Products).
 * =====================================================================
 */

export default function Loading() {
  return <HomeSkeleton />;
}
