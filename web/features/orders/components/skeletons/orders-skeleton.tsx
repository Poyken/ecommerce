import { Skeleton } from "@/components/ui/skeleton";



export function OrdersSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans pt-24 pb-24 relative overflow-hidden">
      {/* Background Gradients - Luxe Theme */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="space-y-2">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Orders List Skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                {/* Order Info */}
                <div className="space-y-4 flex-1">
                  {/* Order Number + Status */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>

                  {/* Order Details */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
                  <Skeleton className="h-10 w-full md:w-32 rounded-lg" />
                  <Skeleton className="h-10 w-full md:w-32 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
