import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAnalyticsStatsAction,
  getSecurityStatsAction,
  getTenantsAction,
} from "@/features/admin/actions";
import { format } from "date-fns";
import { Link } from "@/i18n/routing";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Globe,
  Package,
  Plus,
  Shield,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessTab } from "@/features/super-admin/components/dashboard/business-tab";
import { TechOpsTab } from "@/features/super-admin/components/dashboard/tech-ops-tab";
import { TenantsTab } from "@/features/super-admin/components/dashboard/tenants-tab";

/**
 * =================================================================================================
 * SUPER ADMIN DASHBOARD PAGE - TRANG TỔNG QUAN HỆ THỐNG (PLATFORM OVERVIEW)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MULTI-TENANT ANALYTICS:
 *    - `getAnalyticsStatsAction`: Lấy dữ liệu tổng hợp từ tất cả các Store (Tenants).
 *    - `getTenantsAction`: Lấy danh sách các Store mới nhất để hiển thị tình trạng sức khỏe.
 *
 * 2. SYSTEM MONITORING:
 *    - "System Status" Card: Hiển thị trạng thái giả lập của hạ tầng (API, DB, Worker).
 *    - Trong thực tế, các chỉ số này sẽ được lấy từ Prometheus hoặc AWS CloudWatch.
 *
 * 3. TENANT MANAGEMENT:
 *    - Cung cấp lối tắt "Launch New Tenant" để nhanh chóng provisioning một cửa hàng mới. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export default async function SuperAdminDashboardPage() {
  const t = await getTranslations("superAdmin.dashboard");

  const tenantsRes = await getTenantsAction();
  const tenantsData = tenantsRes?.data || [];
  const recentTenants = tenantsData.slice(0, 5);

  const statsRes = await getAnalyticsStatsAction();
  const stats = statsRes?.data;

  // Security stats reused inside TechOps logic or passed if needed
  // const securityRes = await getSecurityStatsAction();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            {t("title") || "Command Center"}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            {t("subtitle") || "Platform overview and operations."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/super-admin/security">
            <Button variant="outline" className="rounded-xl font-bold h-10">
              <Shield className="mr-2 h-4 w-4" />
              Security Hub
            </Button>
          </Link>
          <Link href="/super-admin/tenants">
            <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 h-10">
              <Plus className="mr-2 h-4 w-4" />
              Launch Tenant
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger
              value="business"
              className="rounded-lg px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Activity className="w-4 h-4 mr-2" /> Business
            </TabsTrigger>
            <TabsTrigger
              value="tech-ops"
              className="rounded-lg px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Zap className="w-4 h-4 mr-2" /> TechOps
            </TabsTrigger>
            <TabsTrigger
              value="tenants"
              className="rounded-lg px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Store className="w-4 h-4 mr-2" /> Tenants
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational
          </div>
        </div>

        <TabsContent
          value="business"
          className="space-y-6 focus-visible:outline-none"
        >
          <BusinessTab stats={stats} />
        </TabsContent>

        <TabsContent
          value="tech-ops"
          className="space-y-6 focus-visible:outline-none"
        >
          <TechOpsTab />
        </TabsContent>

        <TabsContent
          value="tenants"
          className="space-y-6 focus-visible:outline-none"
        >
          <TenantsTab tenants={recentTenants} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
