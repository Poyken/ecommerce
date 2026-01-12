/**
 * =====================================================================
 * ABOUT SKELETON - Skeleton cho trang Giới thiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FULL-PAGE PLACEHOLDER:
 * - Mô phỏng lại toàn bộ cấu trúc trang About bao gồm: Hero section, Mission section và Core Values.
 * - Giúp giảm hiện tượng "nhảy" giao diện (layout shift) khi dữ liệu thật được tải xong.
 *
 * 2. SECTION-BASED SKELETONS:
 * - Mỗi phần của trang được thay thế bằng các khối `Skeleton` có kích thước tương đương với nội dung thật. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

import { Skeleton } from "@/components/ui/skeleton";

export function AboutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton - Full height */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Skeleton className="absolute inset-0" />
        <div className="container relative z-10 px-4 text-center space-y-6 flex flex-col items-center">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-16 w-96 max-w-full" />
          <Skeleton className="h-8 w-[500px] max-w-full" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-24 space-y-32">
        {/* Mission Section Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="aspect-square rounded-3xl" />
        </section>

        {/* Core Values Skeleton */}
        <section>
          <Skeleton className="h-10 w-48 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl border border-border space-y-4"
              >
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
