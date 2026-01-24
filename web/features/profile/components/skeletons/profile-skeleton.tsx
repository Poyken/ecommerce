import { Skeleton } from "@/components/ui/skeleton";



export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans pt-24 pb-24 relative overflow-hidden">
      {/* Background Gradients - Luxe Theme */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Header with Avatar */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="text-center md:text-left space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>

        {/* Profile Form */}
        <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-6">
          <Skeleton className="h-7 w-40 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
