import { Skeleton } from "@/components/ui/skeleton";

/**
 * =====================================================================
 * BRANDS SKELETON - Skeleton cho trang Brands
 * =====================================================================
 *
 * Layout khớp với BrandsPage:
 * - Header: Tiêu đề
 * - Brands Grid: 4 cột
 * =====================================================================
 */

/**
 * =====================================================================
 * BRANDS SKELETON - Skeleton cho trang Brands
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VISUAL CONSISTENCY:
 * - Quan trọng: Cấu trúc HTML của Skeleton PHẢI KHỚP với cấu trúc của Page thật.
 * - Giúp tránh CLS (Content Layout Shift) khi data load xong. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
export function BrandsSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Skeleton className="h-5 w-32 mb-6" />

        {/* Header */}
        <div className="flex flex-col items-center mb-12 space-y-4">
          <Skeleton className="h-4 w-32" /> {/* Luxury Partners */}
          <Skeleton className="h-12 w-64 md:w-96" /> {/* Browse Brands Title */}
          <Skeleton className="h-1 w-24 rounded-full" /> {/* Divider */}
        </div>

        {/* Brands Grid */}
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
