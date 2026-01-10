import {
  getAnalyticsStatsAction,
  getBlogStatsAction,
  getPagesAction,
  getReviewsAction,
  getSalesDataAction,
  getTopProductsAction,
} from "@/features/admin/actions";
import { QuickActions } from "@/features/admin/components/quick-actions";
import { getProfileAction } from "@/features/profile/actions";
import { Link } from "@/i18n/routing";
import { http } from "@/lib/http";
import { AnalyticsStats } from "@/types/dtos";
import { format } from "date-fns";
import { LayoutDashboard, Package, TrendingUp, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessTab } from "@/features/admin/components/dashboard/business-tab";
import { OperationsTab } from "@/features/admin/components/dashboard/operations-tab";
import { CustomersTab } from "@/features/admin/components/dashboard/customers-tab";

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
}

/**
 * =====================================================================
 * ADMIN DASHBOARD (PRO VERSION) 🚀
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRANG DASHBOARD TỔNG QUAN:
 * - Đây là trung tâm điều khiển của Admin, nơi tổng hợp dữ liệu từ nhiều nguồn.
 * - Cung cấp cái nhìn nhanh về doanh thu, đơn hàng, khách hàng và sản phẩm.
 *
 * 2. TỐI ƯU HIỆU NĂNG (Parallel Fetching):
 * - Sử dụng `Promise.all` (dòng 80) để gọi nhiều Server Actions đồng thời.
 * - Việc này giúp giảm tổng thời gian chờ đợi (waiting time) so với việc gọi `await` từng dòng một.
 *
 * 3. DASHBOARD FEATURES:
 * - REAL-TIME PULSE: Hiển thị doanh thu HÔM NAY ngay cạnh tổng doanh thu để chủ shop nắm bắt tình hình tức thì.
 * - ACTIONABLE INSIGHTS: Nổi bật số lượng đơn hàng "Chờ xử lý" (Pending) để nhắc nhở Admin xử lý ngay.
 * - CUSTOMER VOICE: Hiển thị các đánh giá (Reviews) mới nhất để quản trị viên phản hồi khách hàng.
 * - INVENTORY HEALTH: Cảnh báo các SKU sắp hết hàng (Low Stock) để kịp thời nhập thêm.
 *
 * 4. LAZY LOADING CHARTS:
 * - Các biểu đồ (Charts) được load bằng `dynamic import` (Lazy Loading) để giảm kích thước file JavaScript ban đầu.
 * =====================================================================
 */

export default async function AdminDashboardPage() {
  const { data: user } = await getProfileAction();
  if (!user) redirect("/login");

  const t = await getTranslations("admin");

  // Parallel data fetching for maximum performance
  const [
    statsRes,
    salesRes,
    topProductsRes,
    ordersRes,
    skusRes,
    reviewsRes,
    pagesRes,
    blogStatsRes,
  ] = await Promise.all([
    getAnalyticsStatsAction(),
    getSalesDataAction("7"),
    getTopProductsAction(),
    http<{ data: Order[] }>("/orders?limit=5&includeItems=true"),
    http<{ data: any[]; meta: { total: number } }>(
      "/skus?limit=5&stockLimit=5&includeProduct=true"
    ),
    getReviewsAction({ page: 1, limit: 4 }), // 4 recent reviews
    getPagesAction(),
    getBlogStatsAction(),
  ]);

  const stats = (statsRes.data || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    growth: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    lifetimeProducts: 0,
    lifetimeCustomers: 0,
  }) as AnalyticsStats;

  const salesData = (Array.isArray(salesRes.data) ? salesRes.data : []).map(
    (item: unknown) => ({
      name: format(new Date((item as { date: string }).date), "eee"),
      sales: (item as { amount: number }).amount,
    })
  );

  const bestSellersData = (
    Array.isArray(topProductsRes.data) ? topProductsRes.data : []
  ).map((item: unknown) => ({
    name: (item as { productName: string }).productName,
    sales: (item as { quantity: number }).quantity,
  }));

  const recentOrders = ordersRes.data || [];
  const recentReviews = (reviewsRes as any).data || [];
  const lowStockSkus = (skusRes as any).data || [];
  const lowStockCount = (skusRes as any).meta?.total || lowStockSkus.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            {t("dashboard")}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Welcome back, {user.firstName}! Here&apos;s your store command
            center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Actions moved to header for easy access */}
          <QuickActions />
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2 md:pb-0">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger
              value="business"
              className="rounded-lg px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" /> Business
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="rounded-lg px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Package className="w-4 h-4 mr-2" /> Operations
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="rounded-lg px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" /> Customers
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Store Online
          </div>
        </div>

        <TabsContent
          value="business"
          className="space-y-6 focus-visible:outline-none"
        >
          <BusinessTab
            stats={stats}
            salesData={salesData}
            bestSellersData={bestSellersData}
          />
        </TabsContent>

        <TabsContent
          value="operations"
          className="space-y-6 focus-visible:outline-none"
        >
          <OperationsTab
            recentOrders={recentOrders}
            lowStockSkus={lowStockSkus}
            lowStockCount={lowStockCount}
            trendingProducts={bestSellersData}
            stats={stats}
          />
        </TabsContent>

        <TabsContent
          value="customers"
          className="space-y-6 focus-visible:outline-none"
        >
          <CustomersTab recentReviews={recentReviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
