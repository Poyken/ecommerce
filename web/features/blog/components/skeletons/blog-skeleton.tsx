/**
 * =====================================================================
 * BLOG SKELETON - Skeleton cho trang Blog
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FEATURED POST PLACEHOLDER:
 * - Hiển thị một khối lớn ở trên cùng để mô phỏng bài viết nổi bật (Featured Post).
 *
 * 2. BLOG GRID SKELETON:
 * - Sử dụng vòng lặp để tạo ra 6 thẻ bài viết giả lập, mỗi thẻ bao gồm ảnh bìa, tiêu đề và mô tả ngắn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

import { Skeleton } from "@/components/ui/skeleton";

export function BlogSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header Skeleton */}
        <div className="text-center space-y-4 mb-16 flex flex-col items-center">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-6 w-[500px] max-w-full" />
        </div>

        {/* Featured Post Skeleton */}
        <div className="mb-16">
          <Skeleton className="aspect-21/9 rounded-3xl" />
        </div>

        {/* Blog Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border overflow-hidden"
            >
              <Skeleton className="aspect-3/2" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
