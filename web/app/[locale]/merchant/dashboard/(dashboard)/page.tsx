import {
  getAnalyticsStatsAction,
  getBlogStatsAction,
  getPagesAction,
  getReviewsAction,
  getSalesDataAction,
  getTopProductsAction,
} from "@/features/admin/actions";
import { QuickActions } from "@/features/admin/components/widgets/quick-actions";
import { getProfileAction } from "@/features/profile/actions";
import { Link } from "@/i18n/routing";
import { adminOrderService } from "@/features/admin/services/admin-order.service";
import { adminProductService } from "@/features/admin/services/admin-product.service";
import { AnalyticsStats } from "@/types/dtos";
import { format } from "date-fns";
import { LayoutDashboard, Package, TrendingUp, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessTab } from "@/features/admin/components/dashboard/business-tab";
import { OperationsTab } from "@/features/admin/components/dashboard/operations-tab";
import { CustomersTab } from "@/features/admin/components/dashboard/customers-tab";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";
import { RecentChatsWidget } from "@/features/admin/components/widgets/recent-chats-widget";

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
    adminOrderService.getRecentOrders(5),
    adminProductService.getLowStockSkus(5, 5),
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <AdminPageHeader
        title={t("dashboard")}
        subtitle={`Welcome back, ${user.firstName}! Here's your store command center.`}
        icon={<LayoutDashboard className="text-primary fill-primary/10" />}
        variant="indigo"
      >
        <QuickActions />
      </AdminPageHeader>

      <Tabs defaultValue="business" className="space-y-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2 md:pb-0">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner mb-2">
            <TabsTrigger
              value="business"
              className="rounded-xl px-6 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
            >
              <TrendingUp className="w-4 h-4" /> Business
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="rounded-xl px-6 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
            >
              <Package className="w-4 h-4" /> Operations
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="rounded-xl px-6 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
            >
              <Users className="w-4 h-4" /> Customers
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
          <CustomersTab
            recentReviews={recentReviews}
            recentChats={<RecentChatsWidget />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
