import { Skeleton } from "@/components/atoms/skeleton";

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

export function BrandsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Skeleton className="h-10 w-64 mb-8" />

        {/* Brands Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 flex items-center justify-center"
            >
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
