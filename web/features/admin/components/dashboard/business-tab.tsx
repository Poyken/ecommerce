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
import { BusinessInsightsWidget } from "../widgets/business-insights";

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
          // Revenue = Growth/Money = Emerald
          variant="emerald"
          trend={{ value: 12, isPositive: true }}
        />
        <AdminStatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          description={`${stats?.todayOrders || 0} new orders today`}
          icon={ShoppingCart}
          // Orders = Operations = Sky
          variant="sky"
          trend={{ value: 8, isPositive: true }}
        />
        <AdminStatsCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          description="Active registered users"
          icon={Users}
          // Customers = People = Violet
          variant="violet"
        />
        <AdminStatsCard
          title="Products"
          value={stats?.totalProducts || 0}
          description="Live SKUs in inventory"
          icon={Package}
          // Products = Inventory = Teal
          variant="teal"
        />
      </div>

      {/* AI Powered Insights & Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: AI Insights */}
        <div className="lg:col-span-1">
          <BusinessInsightsWidget />
        </div>
        
        {/* Column 2 & 3: Charts */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          {/* Sales Trend */}
          <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-black tracking-tight uppercase text-sm tracking-widest">Sales Trajectory</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground/70">Revenue over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <LazySalesTrendChart data={salesData} />
            </CardContent>
          </div>

          {/* Best Sellers */}
          <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <ShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <span className="font-black tracking-tight uppercase text-sm tracking-widest">Best Sellers</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground/70">Top performing by quantity</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <LazyBestSellersChart data={bestSellersData} />
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
