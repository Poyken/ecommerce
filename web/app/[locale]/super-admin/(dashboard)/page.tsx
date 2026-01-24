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
  getSecurityStatsAction,
  getTenantsAction,
} from "@/features/admin/actions";
import { AdminPageHeader, AdminStatsCard } from "@/features/admin/components/ui/admin-page-components";
import { getPlatformStatsAction } from "@/features/super-admin/actions";
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


export default async function SuperAdminDashboardPage() {
  const t = await getTranslations("superAdmin.dashboard");

  const tenantsRes = await getTenantsAction();
  const tenantsData = tenantsRes?.data || [];
  const recentTenants = tenantsData.slice(0, 5);

  const statsRes = await getPlatformStatsAction();
  const stats = statsRes?.data || {
    totalTenants: 0,
    activeTenants: 0,
    newTenantsThisMonth: 0,
    tenantGrowthRate: 0,
    churnRate: 0,
    mrr: 0,
    mrrFormatted: "0 ₫",
    activeSubscriptions: 0,
    pendingInvoices: 0,
    planDistribution: [],
    recentTenants: [],
  };

  // Security stats reused inside TechOps logic or passed if needed
  // const securityRes = await getSecurityStatsAction();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <AdminPageHeader
        title={t("title") || "Command Center"}
        subtitle={t("subtitle") || "Platform-wide operations & infrastructure monitoring."}
        icon={<Store className="text-indigo-500 fill-indigo-500/20" />}
        variant="indigo"
        actions={
          <div className="flex items-center gap-3">
            <Link href="/super-admin/security">
              <Button variant="outline" className="rounded-xl font-bold h-10 border-white/10 hover:bg-white/5">
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
        }
      />

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
