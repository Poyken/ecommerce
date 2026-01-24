

"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// =====================================================================
// SKELETON COMPONENTS
// =====================================================================

function ChartSkeleton({ title }: { title?: string }) {
  return (
    <Card className="h-full rounded-4xl border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">
          {title || <Skeleton className="h-6 w-32" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] flex items-end justify-between gap-2 p-4">
          {/* Bar chart skeleton */}
          {[40, 70, 45, 80, 55, 90, 65].map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-md"
              style={{
                height: `${height}%`,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PieChartSkeleton({ title }: { title?: string }) {
  return (
    <Card className="h-full rounded-4xl border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">
          {title || <Skeleton className="h-6 w-32" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] flex items-center justify-center">
          <div className="relative">
            {/* Outer ring */}
            <Skeleton className="w-[200px] h-[200px] rounded-full" />
            {/* Inner hole (donut chart) */}
            <div className="absolute inset-0 m-auto w-[140px] h-[140px] rounded-full bg-background" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LineChartSkeleton({ title }: { title?: string }) {
  return (
    <Card className="h-full rounded-4xl border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">
          {title || <Skeleton className="h-6 w-32" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] flex flex-col justify-end gap-3 p-4">
          {/* Simulated line chart area */}
          <div className="flex-1 relative">
            <Skeleton className="absolute bottom-0 left-0 right-0 h-[60%] rounded-md opacity-30" />
            <Skeleton className="absolute bottom-[30%] left-0 right-0 h-1 rounded-full" />
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================================
// DYNAMIC IMPORTS
// =====================================================================

export const LazySalesTrendChart = dynamic(
  () =>
    import("./admin-charts").then((mod) => ({
      default: mod.SalesTrendChart,
    })),
  {
    ssr: false,
    loading: () => <LineChartSkeleton />,
  }
);

export const LazyBestSellersChart = dynamic(
  () =>
    import("./admin-charts").then((mod) => ({
      default: mod.BestSellersChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyOrderStatusChart = dynamic(
  () =>
    import("./admin-charts").then((mod) => ({
      default: mod.OrderStatusChart,
    })),
  {
    ssr: false,
    loading: () => <PieChartSkeleton />,
  }
);

// Export skeletons for external use
export { ChartSkeleton, LineChartSkeleton, PieChartSkeleton };
