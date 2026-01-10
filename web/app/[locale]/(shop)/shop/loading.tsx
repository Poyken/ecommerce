import { ShopSkeleton } from "@/features/products/components/skeletons/shop-skeleton";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Shop
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FILE LOADING.TSX CHO TỪNG ROUTE:
 * - Mỗi route có thể có `loading.tsx` riêng để hiển thị skeleton phù hợp với layout của trang đó.
 * - File này áp dụng cho `/shop` page.
 *
 * 2. SHOPSKELETON COMPONENT:
 * - Đã được tạo sẵn trong `/components/organisms/skeletons/shop-skeleton.tsx`.
 * - Bao gồm: Breadcrumb, Header, Sidebar filters, và Product grid.
 * =====================================================================
 */

export default function Loading() {
  return <ShopSkeleton />;
}
