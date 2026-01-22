"use client";


import { Skeleton } from "@/components/ui/skeleton";

export function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-card rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 ${className}`}
    >
      {/* Image Skeleton */}
      <div className="relative aspect-[3/4]">
        <Skeleton className="h-full w-full rounded-none" />
        {/* Badge skeleton */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category skeleton */}
        <Skeleton className="h-3 w-16 rounded" />

        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4 rounded" />

        {/* Price skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded opacity-60" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProductSkeletonGrid - Grid of product skeletons for loading states
 */
export function ProductSkeletonGrid({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
