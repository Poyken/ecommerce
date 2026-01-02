import { Skeleton } from "@/components/ui/skeleton";

/**
 * =====================================================================
 * CATEGORIES SKELETON - Skeleton cho trang Categories
 * =====================================================================
 *
 * Layout khớp với CategoriesPage:
 * - Header center
 * - Grid 5 cột (responsive)
 * - Card tỷ lệ 4/3
 * =====================================================================
 */

/**
 * =====================================================================
 * CATEGORIES SKELETON - Skeleton cho trang Categories
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VISUAL CONSISTENCY:
 * - Quan trọng: Cấu trúc HTML của Skeleton PHẢI KHỚP với cấu trúc của Page thật.
 * - Giúp tránh CLS (Content Layout Shift) khi data load xong.
 * =====================================================================
 */
export function CategoriesSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Skeleton className="h-5 w-32 mb-6" />

        {/* Header */}
        <div className="flex flex-col items-center mb-12 space-y-4">
          <Skeleton className="h-4 w-24" /> {/* Tagline */}
          <Skeleton className="h-12 w-64 md:w-96" /> {/* Title */}
          <Skeleton className="h-1 w-24 rounded-full" /> {/* Divider */}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="aspect-4/3 rounded-2xl overflow-hidden relative"
            >
              <Skeleton className="w-full h-full" />
              {/* Overlay simulation */}
              <div className="absolute inset-x-4 bottom-4 space-y-2">
                <Skeleton className="h-6 w-3/4 bg-white/20" />
                <Skeleton className="h-4 w-1/2 bg-white/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
