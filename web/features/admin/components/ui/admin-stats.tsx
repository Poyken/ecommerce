import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminAlerts } from "./admin-alerts";
import {
  LazyBestSellersChart as BestSellersChart,
  LazyOrderStatusChart as OrderStatusChart,
  LazySalesTrendChart as SalesTrendChart,
} from "./lazy-admin-charts";

export interface AdminStatsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    growth: {
      revenue: number;
      orders: number;
      products: number;
      users: number;
    };
    salesTrend?: any[];
    bestSellers?: any[];
    orderStatus?: any[];
    lowStockProducts?: any[];
    recentOrders?: any[];
  };
}


export function AdminStats({ stats }: AdminStatsProps) {
  const t = useTranslations("admin");

  const statCards = [
    {
      title: t("stats.revenue"),
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      growth: stats.growth.revenue,
      description: t("vsLastMonth"),
    },
    {
      title: t("stats.orders"),
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      growth: stats.growth.orders,
      description: t("vsLastMonth"),
    },
    {
      title: t("stats.products"),
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      growth: stats.growth.products,
      description: t("vsLastMonth"),
    },
    {
      title: t("stats.customers"),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      growth: stats.growth.users,
      description: t("vsLastMonth"),
    },
  ];

  const salesTrendData = stats.salesTrend || [];
  const bestSellersData = stats.bestSellers || [];
  const orderStatusData = stats.orderStatus || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Stat Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const isPositive = stat.growth >= 0;

          return (
            <Card
              key={i}
              className="rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight">
                  {stat.value}
                </div>
                <div className="flex items-center text-xs mt-1 font-medium">
                  <span
                    className={
                      isPositive ? "text-emerald-500" : "text-rose-500"
                    }
                  >
                    {isPositive ? "+" : ""}
                    {stat.growth}%
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2. Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <SalesTrendChart data={salesTrendData} />
        </div>
        <div className="col-span-3">
          <BestSellersChart data={bestSellersData} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-3">
          <OrderStatusChart data={orderStatusData} />
        </div>
        <div className="col-span-4">
          <AdminAlerts
            lowStockSkus={stats.lowStockProducts || []}
            lowStockCount={stats.lowStockProducts?.length || 0}
            trendingProducts={stats.bestSellers || []}
          />
        </div>
      </div>
    </div>
  );
}
