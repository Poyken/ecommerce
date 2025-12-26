/**
 * =====================================================================
 * SHOP SKELETON - Skeleton cho trang Cửa hàng (Danh sách sản phẩm)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SIDEBAR FILTERS MOCK:
 * - Giả lập bộ lọc sản phẩm bên trái với các danh mục và khoảng giá.
 *
 * 2. TOOLBAR MOCK:
 * - Hiển thị thanh công cụ giả bao gồm thanh tìm kiếm, bộ chọn sắp xếp và tổng số sản phẩm.
 *
 * 3. PRODUCT GRID INTEGRATION:
 * - Tái sử dụng `ProductsSkeleton` để hiển thị lưới 12 sản phẩm giả lập.
 * =====================================================================
 */

import { Skeleton } from "@/components/ui/skeleton";
import { ProductsSkeleton } from "./home-skeleton";

export function ShopSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="border-b border-white/10 pb-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
              <div className="w-full md:w-auto flex gap-4">
                <Skeleton className="h-10 w-full md:w-64" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block lg:col-span-1 space-y-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="lg:col-span-4 space-y-8">
              <ProductsSkeleton count={12} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
