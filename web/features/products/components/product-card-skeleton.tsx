"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * PRODUCT CARD SKELETON - Loading state cho Product Card
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERCEIVED PERFORMANCE:
 * - Hiển thị skeleton thay vì spinner giúp user cảm thấy page load nhanh hơn.
 * - Layout giống y hệt ProductCard thật để tránh "layout shift".
 *
 * 2. USAGE:
 * - Sử dụng trong Suspense boundaries hoặc loading states. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface ProductCardSkeletonProps {
  className?: string;
  isCompact?: boolean;
}

export function ProductCardSkeleton({
  className,
  isCompact = false,
}: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        "group relative bg-card rounded-3xl overflow-hidden border border-foreground/5",
        "transition-all duration-500",
        isCompact ? "p-3" : "p-4",
        className
      )}
    >
      {/* Image Skeleton */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden bg-muted/50",
          isCompact ? "aspect-square" : "aspect-4/5"
        )}
      >
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Content Skeleton */}
      <div className={cn("mt-4 space-y-3", isCompact && "mt-3")}>
        {/* Category */}
        <Skeleton className="h-3 w-16 rounded-full" />

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-3 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards for loading states
 */
export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
        className
      )}
    >
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
