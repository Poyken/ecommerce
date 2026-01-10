/**
 * =====================================================================
 * BUSINESS TAB - Tab Kinh doanh (Analytics)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA VISUALIZATION:
 * - Sử dụng các thư viện biểu đồ (Lazy Admin Charts) để vẽ Chart doanh thu.
 * - Các chỉ số KPI (Key Performance Indicators): Doanh thu, Đơn hàng, Khách hàng, Sản phẩm.
 *
 * 2. UX:
 * - Các thẻ Card có hiệu ứng hover border màu (`border-l-4`) để phân biệt nhanh các nhóm chỉ số.
 * =====================================================================
 */ 
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* High Level KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <Card className="rounded-2xl shadow-sm border-l-4 border-l-emerald-500 hover:shadow-emerald-500/10 transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </CardDescription>
            <CardTitle className="text-3xl font-black flex items-baseline gap-2">
              {formatCurrency(stats.totalRevenue)}
              <span className="text-sm font-bold text-emerald-500 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Today: {formatCurrency(stats.todayRevenue)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-emerald-500 w-[70%]" />
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Lifetime earnings overview
            </p>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="rounded-2xl shadow-sm border-l-4 border-l-blue-500 hover:shadow-blue-500/10 transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardDescription>
            <CardTitle className="text-3xl font-black flex items-baseline gap-2">
              {stats.totalOrders}
              <span className="text-sm font-bold text-blue-500 flex items-center bg-blue-500/10 px-2 py-0.5 rounded-full">
                +{stats.todayOrders} new
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-blue-500 w-[45%]" />
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Processed transactions
            </p>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="rounded-2xl shadow-sm border-l-4 border-l-amber-500 hover:shadow-amber-500/10 transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Customers
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {stats.totalCustomers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-amber-600 bg-amber-500/10 border-0"
              >
                <Users className="w-3 h-3 mr-1" /> Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Registered user base
            </p>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="rounded-2xl shadow-sm border-l-4 border-l-purple-500 hover:shadow-purple-500/10 transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Products
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {stats.totalProducts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-purple-600 bg-purple-500/10 border-0"
              >
                <Package className="w-3 h-3 mr-1" /> In Stock
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Live SKUs on storefront
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Area */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Sales Trajectory
            </CardTitle>
            <CardDescription>Revenue over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <LazySalesTrendChart data={salesData} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-rose-500" />
              Top Performing Products
            </CardTitle>
            <CardDescription>Best sellers by quantity sold</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <LazyBestSellersChart data={bestSellersData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
