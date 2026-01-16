"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LazySalesTrendChart,
  LazyBestSellersChart,
} from "@/features/admin/components/ui/lazy-admin-charts";
import { AdminStatsCard } from "@/features/admin/components/ui/admin-page-components";

interface BusinessTabProps {
  stats: any;
  salesData: any[];
  bestSellersData: any[];
}

export function BusinessTab({
  stats,
  salesData,
  bestSellersData,
}: BusinessTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* High Level KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description={`Today: ${formatCurrency(stats.todayRevenue)}`}
          icon={DollarSign}
          variant="neon"
          trend={{ value: 12, isPositive: true }}
        />
        <AdminStatsCard
          title="Total Orders"
          value={stats.totalOrders}
          description={`${stats.todayOrders} new orders today`}
          icon={ShoppingCart}
          variant="info"
          trend={{ value: 8, isPositive: true }}
        />
        <AdminStatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          description="Active registered users"
          icon={Users}
          variant="aurora"
        />
        <AdminStatsCard
          title="Products"
          value={stats.totalProducts}
          description="Live SKUs in inventory"
          icon={Package}
          variant="warning"
        />
      </div>

      {/* Charts Area */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-xl bg-[var(--aurora-blue)]/20 border border-[var(--aurora-blue)]/30">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-black tracking-tight uppercase text-sm tracking-[0.1em]">Sales Trajectory</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/70">Revenue over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <LazySalesTrendChart data={salesData} />
          </CardContent>
        </div>

        <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-xl bg-[var(--aurora-purple)]/20 border border-[var(--aurora-purple)]/30">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="font-black tracking-tight uppercase text-sm tracking-[0.1em]">Best Sellers</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/70">Top performing by quantity</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <LazyBestSellersChart data={bestSellersData} />
          </CardContent>
        </div>
      </div>
    </div>
  );
}
