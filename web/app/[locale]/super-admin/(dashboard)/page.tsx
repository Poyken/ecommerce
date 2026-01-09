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
 *    - Cung cấp lối tắt "Launch New Tenant" để nhanh chóng provisioning một cửa hàng mới.
 * =================================================================================================
 */
export default async function SuperAdminDashboardPage() {
  const t = await getTranslations("superAdmin.dashboard");

  const tenantsRes = await getTenantsAction();
  const tenantsData = tenantsRes?.data || [];
  const recentTenants = tenantsData.slice(0, 5);

  const statsRes = await getAnalyticsStatsAction();
  const stats = statsRes?.data;

  const securityRes = await getSecurityStatsAction();
  const securityStats = securityRes?.data;

  // Calculate real distribution
  const allTenants = tenantsData;
  const totalTenants = allTenants.length;
  const enterpriseCount = allTenants.filter(
    (t: any) => t.plan === "ENTERPRISE"
  ).length;
  const enterprisePercent =
    totalTenants > 0 ? Math.round((enterpriseCount / totalTenants) * 100) : 0;
  const basicProPercent = totalTenants > 0 ? 100 - enterprisePercent : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/super-admin/security">
            <Button variant="outline" className="rounded-xl font-bold">
              <Shield className="mr-2 h-4 w-4" />
              {t("actions.securityHub")}
            </Button>
          </Link>
          <Link href="/super-admin/tenants">
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20">
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.launchTenant")}
            </Button>
          </Link>
        </div>
      </div>

      {/* SaaS Business Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t("stats.mrr")}
            </CardDescription>
            <CardTitle className="text-3xl font-black flex items-center gap-2">
              ${(stats?.totalRevenue || 0).toLocaleString()}
              {stats?.growth ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">
                  +{stats.growth}%
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <DollarSign className="h-3 w-3" />
              {t("stats.mrrDesc")}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-blue-500/20 bg-blue-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {t("stats.transactions")}
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {(stats?.totalOrders || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <TrendingUp className="h-3 w-3" />
              {t("stats.transactionsDesc")}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-purple-500/20 bg-purple-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
              {t("stats.health")}
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {securityStats?.threatGrade || "A+"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <CheckCircle2 className="h-3 w-3" />
              {t("stats.healthDesc")}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              {t("stats.pending")}
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {stats?.pendingOrders || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
              <AlertCircle className="h-3 w-3" />
              {t("stats.pendingDesc")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Tenants Section */}
        <Card className="lg:col-span-4 rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">
                {t("recentTenants.title")}
              </CardTitle>
              <CardDescription>{t("recentTenants.subtitle")}</CardDescription>
            </div>
            <Link href="/super-admin/tenants">
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-indigo-600"
              >
                {t("recentTenants.viewAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-2xl bg-muted/30">
                  <Store className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <span className="text-muted-foreground font-medium">
                    {t("recentTenants.empty")}
                  </span>
                </div>
              ) : (
                recentTenants.map((tenant: any) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor:
                            tenant.themeConfig?.primaryColor || "#6366f1",
                          backgroundImage: `linear-gradient(135deg, ${
                            tenant.themeConfig?.primaryColor || "#6366f1"
                          } 0%, #4338ca 100%)`,
                        }}
                      >
                        {(tenant.name || "Tenant")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base leading-none">
                            {tenant.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 font-bold uppercase tracking-widest"
                          >
                            {tenant.plan}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">
                            {tenant.domain}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />{" "}
                            {tenant._count?.users || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />{" "}
                            {tenant._count?.products || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />{" "}
                            {tenant._count?.orders || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("recentTenants.healthy")}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                        {format(new Date(tenant.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health / Quick Info Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-3xl border-foreground/5 shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                <CardTitle className="text-lg font-bold">
                  {t("systemStatus.title")}
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                {t("systemStatus.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">
                    {t("systemStatus.apiGateway")}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {t("systemStatus.operational")}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">
                    {t("systemStatus.dbCluster")}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {t("systemStatus.optimal", { ms: 12 })}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">
                    {t("systemStatus.workerNodes")}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {t("systemStatus.scaling")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-foreground/5 shadow-sm bg-linear-to-br from-indigo-600 to-indigo-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t("distribution.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80">
                    {t("distribution.enterprise")}
                  </span>
                  <span className="font-black">{enterprisePercent}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${enterprisePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm mt-4">
                  <span className="opacity-80">
                    {t("distribution.basicPro")}
                  </span>
                  <span className="font-black">{basicProPercent}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-300 transition-all duration-1000"
                    style={{ width: `${basicProPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-rose-900 dark:text-rose-400 text-sm">
                {t("warning.title")}
              </h4>
              <div className="text-xs text-rose-700 dark:text-rose-500/80 mt-1 font-medium leading-relaxed">
                {t.rich("warning.sslExpire", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
