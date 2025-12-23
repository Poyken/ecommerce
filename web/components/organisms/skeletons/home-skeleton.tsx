/**
 * =====================================================================
 * HOME SKELETON - Skeleton cho trang Chủ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HERO SECTION MOCKUP:
 * - Giả lập phần banner lớn ở đầu trang với các khối text và nút bấm giả.
 *
 * 2. REUSABLE PRODUCT SKELETON:
 * - Cung cấp component `ProductsSkeleton` để tái sử dụng ở nhiều nơi (Home, Shop, Wishlist).
 * - Hỗ trợ tùy chỉnh số lượng item hiển thị thông qua prop `count`.
 *
 * 3. CATEGORY GRID MOCK:
 * - Giả lập các ô danh mục sản phẩm với tỷ lệ khung hình `aspect-[4/5]`.
 * =====================================================================
 */

import { Skeleton } from "@/components/atoms/skeleton";

export function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="relative aspect-4/5 rounded-2xl overflow-hidden"
        >
          <Skeleton className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

export function ProductsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-3/4 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Skeleton - Full viewport */}
      <section className="h-screen w-full relative flex items-center justify-center">
        <Skeleton className="absolute inset-0" />
        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-8">
          <div className="space-y-8">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-40 rounded-full" />
              <Skeleton className="h-12 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="hidden lg:block h-[500px] rounded-3xl" />
        </div>
      </section>
    </div>
  );
}
