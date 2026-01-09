import { UserAvatar } from "@/components/molecules/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAnalyticsStatsAction,
  getBlogStatsAction,
  getPagesAction,
  getReviewsAction,
  getSalesDataAction,
  getTopProductsAction,
} from "@/features/admin/actions";
import { AdminAlerts } from "@/features/admin/components/admin-alerts";
import {
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/admin-page-components";
import {
  LazyBestSellersChart as BestSellersChart,
  LazySalesTrendChart as SalesTrendChart,
} from "@/features/admin/components/lazy-admin-charts";
import { QuickActions } from "@/features/admin/components/quick-actions";
import { StorefrontPulse } from "@/features/admin/components/storefront-pulse";
import { getProfileAction } from "@/features/profile/actions";
import { AiInsightsWidget } from "@/components/admin/ai-insights-widget";
import { RecentChatsWidget } from "@/features/admin/components/recent-chats-widget";
import { Link } from "@/i18n/routing";
import { http } from "@/lib/http";
import { cn, formatCurrency } from "@/lib/utils";
import { AnalyticsStats } from "@/types/dtos";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
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

  const pagesCount = (pagesRes as any).data?.length || 0;
  const publishedBlogs = (blogStatsRes as any).data?.published || 0;

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
  const recentReviews = (reviewsRes as any).data || []; // reviewsRes is ActionResult
  const lowStockSkus = (skusRes as any).data || [];
  const lowStockCount = (skusRes as any).meta?.total || lowStockSkus.length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "PENDING":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "PROCESSING":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "CANCELLED":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <AdminPageHeader
        title={t("dashboard")}
        subtitle={`Welcome back, ${user.firstName}! Here's what's happening today.`}
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Storefront Customization Pulse */}
      <StorefrontPulse
        pagesCount={pagesCount}
        publishedBlogs={publishedBlogs}
      />

      {/* Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card - Highlight TODAY */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("stats.revenue")}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  +{formatCurrency(stats.todayRevenue)} today
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Card - Highlight PENDING */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-blue-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("stats.orders")}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">{stats.totalOrders}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {stats.pendingOrders > 0 ? (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {stats.pendingOrders} Pending Action
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  All caught up!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customers Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-amber-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("stats.customers")}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">
                {stats.lifetimeCustomers}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-3 w-3" />
                Active
              </span>
              <span className="text-xs text-muted-foreground">users</span>
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-purple-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("stats.products")}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">
                {stats.lifetimeProducts}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                <ArrowUpRight className="h-3 w-3" />
                Live
              </span>
              <span className="text-xs text-muted-foreground">on store</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesTrendChart data={salesData} />
        <BestSellersChart data={bestSellersData} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content Column */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Recent Orders */}
          <AdminTableWrapper
            title={t("recentOrders")}
            headerActions={
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
              >
                {t("viewAll")}
                <ExternalLink className="h-3 w-3" />
              </Link>
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px]">{t("orderId")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: Order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/orders/${order.id}` as any}
                          className="font-mono text-sm text-primary hover:underline font-bold"
                        >
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium text-[10px] px-1.5 py-0.5",
                          getStatusStyle(order.status)
                        )}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-sm">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AdminTableWrapper>

          {/* Recent Reviews (New Section) */}
          <AdminTableWrapper
            title={t("reviews.title")}
            headerActions={
              <Link
                href="/admin/reviews"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
              >
                {t("viewAll")}
                <ExternalLink className="h-3 w-3" />
              </Link>
            }
          >
            <div className="divide-y divide-border">
              {recentReviews.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No recent reviews.
                </div>
              ) : (
                recentReviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="p-4 flex gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="shrink-0">
                      <UserAvatar
                        src={review.user?.avatarUrl}
                        alt={`${review.user?.firstName} ${review.user?.lastName}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold truncate">
                          {review.user?.firstName} {review.user?.lastName}
                        </span>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3 h-3",
                                i < review.rating
                                  ? "fill-current"
                                  : "text-muted-foreground/20"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        &quot;{review.content}&quot;
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(review.createdAt), "dd/MM/yyyy")}
                        <span className="text-border">|</span>
                        <span className="truncate max-w-[150px]">
                          {review.product?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminTableWrapper>
        </div>

        {/* Sidebar Column: AI Insights + Alerts + Trending */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-6">
          <AiInsightsWidget />
          <RecentChatsWidget />
          <AdminAlerts
            lowStockSkus={lowStockSkus}
            lowStockCount={lowStockCount}
            trendingProducts={bestSellersData}
          />
        </div>
      </div>
    </div>
  );
}
