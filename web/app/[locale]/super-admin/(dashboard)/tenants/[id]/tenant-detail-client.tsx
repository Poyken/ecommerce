"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/routing";
import { Tenant } from "@/types/models";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  CreditCard,
  Database,
  ExternalLink,
  Globe,
  HardDrive,
  Lock,
  Settings,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =================================================================================================
 * TENANT DETAIL CLIENT - CHI TIẾT CHI NHÁNH & GIÁM SÁT HỆ THỐNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TENANT MONITORING:
 *    - Màn hình này cung cấp cái nhìn 360 độ về một Store: Doanh thu, Đơn hàng, Khách hàng.
 *    - Các chỉ số Cloud (CPU, DB Load) là các chỉ số quan trọng để Super Admin đảm bảo Store vận hành ổn định.
 *
 * 2. RESOURCE QUOTAS:
 *    - Mỗi gói (BASIC, PRO, ENTERPRISE) đều có giới hạn (Limits) về sản phẩm và dung lượng.
 *    - Logic tính toán % usage giúp phát hiện các Store sắp vượt ngưỡng để gợi ý nâng cấp.
 *
 * 3. LOCAL DOMAIN CONFIG:
 *    - Giải thích cách cấu hình file `hosts` để lập trình viên có thể truy cập Store cục bộ
 *      qua tên miền tùy chỉnh (VD: store1.localhost). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export function TenantDetailClient({ tenant }: { tenant: Tenant }) {
  const t = useTranslations("superAdmin.tenants.tenantDetail");

  // Mocked plan limits based on plan type
  const planLimits = {
    BASIC: { products: 100, storage: 1, bandwidth: 50 },
    PRO: { products: 1000, storage: 10, bandwidth: 500 },
    ENTERPRISE: { products: 10000, storage: 100, bandwidth: 5000 },
  }[tenant.plan] || { products: 0, storage: 0, bandwidth: 0 };

  // Mocked current usage
  const usage = {
    products: 65,
    storage: 0.4,
    bandwidth: 12.5,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Breadcrumb / Back Button */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/super-admin" className="hover:text-foreground">
          SuperAdmin
        </Link>
        <span>/</span>
        <Link href="/super-admin/tenants" className="hover:text-foreground">
          Tenants
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tenant.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl border-4 border-background flex items-center justify-center text-2xl font-black text-white shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300"
            style={{
              backgroundColor: tenant.themeConfig?.primaryColor || "#6366f1",
              backgroundImage: `linear-gradient(135deg, ${
                tenant.themeConfig?.primaryColor || "#6366f1"
              } 0%, #4338ca 100%)`,
            }}
          >
            {(tenant.name || "Tenant").substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight">
                {tenant.name}
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 font-bold"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {t("dnsSecurity.active")}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground mt-2">
              <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">{tenant.domain}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  {tenant.plan}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-foreground/10 hover:bg-muted font-bold"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("buttons.settings")}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-foreground/10 hover:bg-muted font-bold text-rose-500 hover:text-rose-600"
          >
            <Lock className="mr-2 h-4 w-4" />
            {t("buttons.suspend")}
          </Button>
          <Button
            onClick={() => {
              const protocol = window.location.protocol;
              const host = window.location.host;
              const isLocal = host.includes("localhost");
              let targetDomain = tenant.domain;

              // For local development testing (e.g., tenant1.localhost:3000)
              if (isLocal && !targetDomain.includes(":")) {
                const port = host.split(":")[1] || "3000";
                targetDomain = `${targetDomain}:${port}`;
              }

              window.open(`${protocol}//${targetDomain}/admin`, "_blank");
            }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 font-bold px-6"
          >
            <Zap className="mr-2 h-4 w-4 fill-current" />
            {t("buttons.enterPortal")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <div className="bg-muted/50 p-1 rounded-xl inline-flex mb-6">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold"
                >
                  {t("tabs.overview")}
                </TabsTrigger>
                <TabsTrigger
                  value="subscription"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold"
                >
                  {t("tabs.subscription")}
                </TabsTrigger>
                <TabsTrigger
                  value="usage"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold"
                >
                  {t("tabs.usage")}
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold"
                >
                  {t("tabs.logs")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-2xl border-foreground/5 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">
                      {t("stats.revenue")}
                    </CardTitle>
                    <CreditCard className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">$45,231</div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-1">
                      <Activity className="h-3 w-3" />
                      {t("stats.vsLastMonth", { value: "+12.5%" })}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-foreground/5 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">
                      {t("stats.orders")}
                    </CardTitle>
                    <Activity className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">1,482</div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-1">
                      <Activity className="h-3 w-3" />
                      {t("stats.vsLastMonth", { value: "+5.2%" })}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-foreground/5 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">
                      {t("stats.customers")}
                    </CardTitle>
                    <Users className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">8,902</div>
                    <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold mt-1">
                      <Activity className="h-3 w-3" />
                      {t("stats.vsLastMonth", { value: "-0.4%" })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-foreground/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("performance.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("performance.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium">
                            {t("performance.responseTime")}
                          </span>
                        </div>
                        <span className="font-bold">142ms</span>
                      </div>
                      <Progress value={20} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium">
                            {t("performance.dbLoad")}
                          </span>
                        </div>
                        <span className="font-bold">15%</span>
                      </div>
                      <Progress value={15} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">
                            {t("performance.assetsDelivery")}
                          </span>
                        </div>
                        <span className="font-bold">Cloudfront</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                        <div className="w-full bg-orange-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-foreground/5 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg font-bold">
                    {t("recentActivities.title")}
                  </CardTitle>
                </CardHeader>
                <div className="divide-y divide-foreground/5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-background border flex items-center justify-center">
                          {i === 1 ? (
                            <Users className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Activity className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {i === 1
                              ? t("recentActivities.adminLogin")
                              : t("recentActivities.bulkUpdate")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {i === 1 ? "admin@store.com" : "via API"}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {t("recentActivities.minsAgo", { mins: i * 15 })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6 mt-0">
              <Card className="rounded-2xl border-foreground/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("usage.title")}
                  </CardTitle>
                  <CardDescription
                    dangerouslySetInnerHTML={{
                      __html: t("usage.description", {
                        plan: tenant.plan,
                      }),
                    }}
                  />
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-sm font-black">
                          {t("usage.products")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("usage.itemsOf", {
                            usage: usage.products,
                            limit: planLimits.products,
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-black">
                        {Math.round(
                          (usage.products / planLimits.products) * 100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(usage.products / planLimits.products) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-sm font-black">
                          {t("usage.storage")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("usage.gbOf", {
                            usage: usage.storage,
                            limit: planLimits.storage,
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-black">
                        {Math.round((usage.storage / planLimits.storage) * 100)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(usage.storage / planLimits.storage) * 100}
                      className="h-2 bg-muted shadow-inner"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-sm font-black">
                          {t("usage.bandwidth")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("usage.gbOf", {
                            usage: usage.bandwidth,
                            limit: planLimits.bandwidth,
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-black">
                        {Math.round(
                          (usage.bandwidth / planLimits.bandwidth) * 100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(usage.bandwidth / planLimits.bandwidth) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold text-amber-800 dark:text-amber-400">
                        {t("usage.approachingLimit")}
                      </p>
                      <p className="text-amber-700 dark:text-amber-500/80">
                        {t("usage.approachingLimitDesc", { percent: 65 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription">
              <div className="space-y-4">
                <Card className="rounded-2xl border-indigo-500/20 bg-indigo-500/2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      {t("subscription.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-background border rounded-2xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <Zap className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl">{tenant.plan}</h3>
                          <p className="text-sm text-muted-foreground font-medium">
                            {t("subscription.renewalDate", {
                              date: format(
                                new Date(tenant.createdAt),
                                "dd/MM/yyyy"
                              ),
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black">$49.00</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                          {t("subscription.perMonth")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="rounded-xl h-12 font-bold"
                      >
                        {t("subscription.updatePlan")}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl h-12 font-bold text-rose-500"
                      >
                        {t("subscription.cancelSubscription")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-foreground/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t("technicalInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  {t("technicalInfo.id")}
                </p>
                <p className="text-sm font-mono bg-muted p-2 rounded-lg break-all">
                  {tenant.id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  {t("technicalInfo.domain")}
                </p>
                <a
                  href={`http://${tenant.domain}`}
                  target="_blank"
                  className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm group"
                >
                  <span className="font-bold truncate">{tenant.domain}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  {t("technicalInfo.deploymentDate")}
                </p>
                <p className="text-sm font-bold px-1">
                  {format(new Date(tenant.createdAt), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  {t("technicalInfo.locale")}
                </p>
                <Badge variant="secondary" className="font-bold">
                  en-US
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-foreground/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t("dnsSecurity.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm py-2 border-b border-foreground/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{t("dnsSecurity.ssl")}</span>
                </div>
                <span className="font-bold text-xs text-muted-foreground">
                  {t("dnsSecurity.active")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-foreground/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{t("dnsSecurity.dns")}</span>
                </div>
                <span className="font-bold text-xs text-muted-foreground">
                  {t("dnsSecurity.propagated")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  <span>{t("dnsSecurity.ddos")}</span>
                </div>
                <span className="font-bold text-xs text-muted-foreground">
                  {t("dnsSecurity.enabled")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-indigo-500/20 bg-indigo-500/3 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-500" />
                {t("localSetup.title")}
              </CardTitle>
              <CardDescription>{t("localSetup.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p
                  className="font-medium"
                  dangerouslySetInnerHTML={{
                    __html: t("localSetup.guide", {
                      domain: tenant.domain,
                    }),
                  }}
                />
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                  <li
                    dangerouslySetInnerHTML={{
                      __html: t("localSetup.step1"),
                    }}
                  />
                  <li
                    dangerouslySetInnerHTML={{
                      __html: t("localSetup.step2", {
                        domain: tenant.domain,
                      }),
                    }}
                  />
                  <li
                    dangerouslySetInnerHTML={{
                      __html: t("localSetup.step3"),
                    }}
                  />
                </ol>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/10">
            <h3 className="font-black text-lg">{t("notes.title")}</h3>
            <p className="text-sm opacity-90 mt-2 leading-relaxed">
              {t("notes.highValue")}
            </p>
            <Button
              variant="secondary"
              className="w-full mt-4 rounded-xl font-bold bg-white/20 hover:bg-white/30 text-white border-0"
            >
              {t("notes.addNote")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
