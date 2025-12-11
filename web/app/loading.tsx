import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
       {/* Hero Skeleton */}
       <div className="h-[500px] w-full mb-12 rounded-3xl overflow-hidden relative">
            <Skeleton className="absolute inset-0" />
       </div>

      <div className="flex gap-8 mb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-2">
               {[1, 2, 3, 4, 5].map(i => (
                 <Skeleton key={i} className="h-8 w-full" />
               ))}
            </div>
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-2/3" />
                             <Skeleton className="h-6 w-1/3" />
                        </div>
                    </div>
                 ))}
            </div>
        </div>
      </div>
    </div>
  );
}
