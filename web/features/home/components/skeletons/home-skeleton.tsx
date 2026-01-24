

import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center p-5 gap-5 rounded-4xl bg-background border border-foreground/5 overflow-hidden"
        >
          {/* Image Skeleton */}
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />

          {/* Text Content Skeleton */}
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-1 w-1 rounded-full" />
              <Skeleton className="h-3 w-1/3 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BrandsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center p-5 gap-5 rounded-2xl bg-card/50 border border-border/40 overflow-hidden"
        >
          <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductsSkeleton({
  count = 4,
  columns = 4,
}: {
  count?: number;
  columns?: number;
}) {
  const gridClasses: Record<number, string> = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  };

  return (
    <div
      className={`grid grid-cols-2 gap-4 md:gap-6 lg:gap-8 ${
        gridClasses[columns] || "lg:grid-cols-4"
      }`}
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-4 group">
          <div className="relative aspect-4/5 rounded-3xl overflow-hidden bg-muted/20 border border-foreground/5">
            <Skeleton className="h-full w-full" />
            <div className="absolute top-4 left-4">
              <Skeleton className="h-6 w-12 rounded-full opacity-50" />
            </div>
          </div>
          <div className="space-y-3 px-1">
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/4 rounded-full opacity-30" />
              <Skeleton className="h-5 w-full rounded-lg" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-1/3 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full opacity-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
