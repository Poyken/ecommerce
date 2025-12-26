import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * =====================================================================
 * PRODUCT DETAIL LOADING - Giao diện chờ cho trang chi tiết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKELETON COMPOSITION:
 * - Sử dụng `aspect-[3/4]` cho ảnh sản phẩm để khớp với kích thước ảnh thật.
 * - Mô phỏng lại cấu trúc 2 cột (Ảnh bên trái, Thông tin bên phải) của trang chi tiết.
 *
 * 2. ANIMATION:
 * - Mặc định `Skeleton` có hiệu ứng pulse (nhấp nháy nhẹ) để báo hiệu nội dung đang được tải.
 *
 * 3. RESPONSIVENESS:
 * - `grid-cols-1 lg:grid-cols-2`: Chuyển từ 1 cột (mobile) sang 2 cột (desktop) giống hệt trang thật.
 * =====================================================================
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <div className="container mx-auto px-4 md:px-8 py-8 lg:py-12">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 lg:mb-8">
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            <GlassCard className="aspect-[3/4] w-full overflow-hidden relative rounded-2xl">
              <Skeleton className="w-full h-full" />
            </GlassCard>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              <Skeleton className="h-12 w-3/4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            <Skeleton className="h-32 w-full" />

            <div className="space-y-6 pt-6 border-t border-border/50">
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="flex flex-wrap gap-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-lg" />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="flex flex-wrap gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-10 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <Skeleton className="h-14 w-32 rounded-xl" />
              <Skeleton className="h-14 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
