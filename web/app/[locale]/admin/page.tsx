import { getProfileAction } from "@/actions/profile";
import { Badge } from "@/components/atoms/badge";
import { Card } from "@/components/atoms/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { AdminAlerts } from "@/components/organisms/admin/admin-alerts";
import {
  BestSellersChart,
  SalesTrendChart,
} from "@/components/organisms/admin/admin-charts";
import { QuickActions } from "@/components/organisms/admin/quick-actions";
import { Link } from "@/i18n/routing";
import { http } from "@/lib/http";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { redirect } from "next/navigation";

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items?: {
    quantity: number;
    sku: {
      product: {
        name: string;
      };
    };
  }[];
}

interface User {
  id: string;
}

interface Product {
  id: string;
}

/**
 * =====================================================================
 * ADMIN DASHBOARD - Trang tổng quan
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DATA FETCHING STRATEGY:
 * - Dashboard cần rất nhiều dữ liệu (Orders, Users, Products, SKUs).
 * - Sử dụng `Promise.all` để gọi song song 4 API requests.
 * - Giúp giảm đáng kể thời gian load trang so với gọi tuần tự (Sequential).
 *
 * DATA CALCULATION:
 * - Tính toán các chỉ số (Revenue, Total Orders...) trực tiếp từ dữ liệu thô.
 * - `reduce`, `filter`, `map` được sử dụng dày đặc để xử lý mảng.
 * - Ví dụ: Tính doanh thu 7 ngày gần nhất để vẽ biểu đồ.
 *
 * UI COMPONENTS:
 * - Sử dụng `Card` để hiển thị các chỉ số chính (KPIs).
 * - Sử dụng Chart components (`SalesTrendChart`, `BestSellersChart`) để trực quan hóa dữ liệu.
 * - Sử dụng `Table` để liệt kê đơn hàng mới nhất.
 * =====================================================================
 */
import {
  getAnalyticsStatsAction,
  getSalesDataAction,
  getTopProductsAction,
} from "@/actions/admin";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const { data: user } = await getProfileAction();
  if (!user) redirect("/login");

  const t = await getTranslations("admin");

  // Parallel data fetching
  const [statsRes, salesRes, topProductsRes, ordersRes, skusRes] =
    await Promise.all([
      getAnalyticsStatsAction(),
      getSalesDataAction(7),
      getTopProductsAction(5),
      http<{ data: Order[] }>("/orders?limit=5&includeItems=true"),
      http<{ data: unknown[] }>("/skus?limit=1000&includeProduct=true"),
    ]);

  const stats = (statsRes.data as Record<string, number> | undefined) || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  };
  const salesData = (Array.isArray(salesRes.data) ? salesRes.data : []).map(
    (item: unknown) => ({
      name: new Date((item as { date: string }).date).toLocaleDateString(
        "en-US",
        { weekday: "short" }
      ),
      sales: (item as { amount: number }).amount,
    })
  );
  // console.log('[Dashboard] Sales Data:', JSON.stringify(salesData, null, 2));
  const bestSellersData = (
    Array.isArray(topProductsRes.data) ? topProductsRes.data : []
  ).map((item: unknown) => ({
    name: (item as { productName: string }).productName,
    sales: (item as { quantity: number }).quantity,
  }));
  const recentOrders = ordersRes.data || [];
  const skus = skusRes.data || [];

  // Calculate Low Stock SKUs
  const lowStockSkus = skus.filter(
    (sku: unknown) => (sku as { stock: number }).stock < 5
  );

  const totalRevenue = (stats as { totalRevenue: number }).totalRevenue;
  const totalOrders = (stats as { totalOrders: number }).totalOrders;
  const totalCustomers = (stats as { totalCustomers: number }).totalCustomers;
  const totalProducts = (stats as { totalProducts: number }).totalProducts;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("overview")}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Key Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 shadow-sm border-border bg-card">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("stats.revenue")}
            </h3>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              +20.1% ↑
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {t("vsLastMonth")}
            </span>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-border bg-card">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("stats.orders")}
            </h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            +{totalOrders}
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center">
              +180% ↑
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {t("vsLastMonth")}
            </span>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-border bg-card">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("stats.customers")}
            </h3>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            +{totalCustomers}
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center">
              +19% ↑
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {t("vsLastMonth")}
            </span>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-border bg-card">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("stats.products")}
            </h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            +{totalProducts}
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center">
              +201 ↑
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {t("sinceLastHour")}
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesTrendChart data={salesData} />
        <BestSellersChart data={bestSellersData} />
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Recent Orders Table */}
        <div className="flex-1 min-w-0">
          <Card className="p-6 shadow-sm border-border bg-card h-full">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                {t("recentOrders")}
              </h3>
              <Link
                href="/admin/orders"
                className="text-sm text-primary hover:underline font-medium"
              >
                {t("viewAll")}
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground font-bold">
                    {t("orderId")}
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold">
                    {t("customer")}
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold">
                    {t("status")}
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground font-bold">
                    {t("amount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className="border-border hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground font-mono">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.user
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : t("guest")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`
                              ${
                                order.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : order.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : order.status === "CANCELLED"
                                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }
                            `}
                      >
                        {order.status === "COMPLETED"
                          ? t("completed")
                          : order.status === "PENDING"
                          ? t("pending")
                          : order.status === "CANCELLED"
                          ? t("cancelled")
                          : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground font-medium">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("noOrders")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Smart Alerts */}
        <div className="w-full xl:w-[380px] shrink-0">
          <AdminAlerts
            lowStockSkus={lowStockSkus}
            trendingProducts={bestSellersData}
          />
        </div>
      </div>
    </div>
  );
}
