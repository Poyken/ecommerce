import { Skeleton } from "@/components/ui/skeleton";



export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans pt-24 pb-24 relative overflow-hidden">
      {/* Background Gradients - Luxe Theme */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Back Link */}
        <div className="mb-6">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <Skeleton className="h-8 w-44 rounded-full mb-4" />
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Address Selector */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-white/10 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <Skeleton className="h-7 w-48 mb-6" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-white/10 flex items-center gap-4"
                  >
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-4">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm sticky top-24 space-y-6">
              <Skeleton className="h-7 w-36" />

              {/* Items */}
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>

              {/* Summary */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>

              {/* Button */}
              <Skeleton className="h-12 w-full rounded-xl" />

              {/* Trust Badge */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
