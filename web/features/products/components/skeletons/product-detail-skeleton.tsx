/**
 * =====================================================================
 * PRODUCT DETAIL SKELETON - Skeleton cho trang Chi tiết sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GALLERY & INFO SPLIT:
 * - Mô phỏng bố cục 2 cột: Bộ sưu tập ảnh (trái) và Thông tin chi tiết/Chọn biến thể (phải).
 *
 * 2. VARIANT SELECTOR MOCK:
 * - Giả lập các nút chọn Size, Color bằng các hình tròn/bo góc nhỏ để người dùng hình dung được giao diện.
 *
 * 3. BREADCRUMB MOCK:
 * - Hiển thị đường dẫn phân cấp giả ở trên cùng để duy trì cấu trúc trang. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="container mx-auto px-4 md:px-8 py-8 lg:py-12">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 lg:mb-8 flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Gallery Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-3/4 w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Info Skeleton (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <div className="h-px w-8 bg-muted"></div>
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="flex justify-between items-start">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-4" />
                  ))}
                </div>
                <Skeleton className="h-4 w-32" />
              </div>

              <Skeleton className="h-24 w-full" />
            </div>

            {/* Selectors Skeleton */}
            <div className="p-6 md:p-8 space-y-6 rounded-3xl border border-white/10 bg-white/5">
              <div className="space-y-4">
                <Skeleton className="h-6 w-16" />
                <div className="flex gap-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-20 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-16" />
                <div className="flex gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-10 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-full rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
