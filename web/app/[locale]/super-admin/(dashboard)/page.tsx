import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsStatsAction, getTenantsAction } from "@/features/admin/actions";
import { AdminStats } from "@/features/admin/components/admin-stats";
import { Link } from "@/i18n/routing";
import { AlertCircle, ArrowRight, CheckCircle2, Globe, Plus, Shield, Store, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SuperAdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");

  const [statsRes, tenantsRes] = await Promise.all([
      getAnalyticsStatsAction(),
      getTenantsAction()
  ]);
  
  const tenantsData = tenantsRes && "data" in tenantsRes ? tenantsRes.data : null;
  const recentTenants = Array.isArray(tenantsData?.data) ? tenantsData.data.slice(0, 5) : [];
  const totalTenantsCount = tenantsData?.meta?.total || 0;

  const rawStats = statsRes && "data" in statsRes ? statsRes.data : null;

  const stats = {
    totalRevenue: rawStats?.totalRevenue || 0,
    totalOrders: rawStats?.totalOrders || 0,
    totalProducts: rawStats?.totalProducts || 0,
    totalUsers: rawStats?.totalCustomers || 0,
    growth: {
      revenue: rawStats?.growth || 0,
      orders: 0,
      products: 0,
      users: 0,
    },
    salesTrend: [],
    bestSellers: [],
    orderStatus: [],
    lowStockProducts: [],
    recentOrders: [],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Platform Control.</h1>
            <p className="text-muted-foreground mt-1 font-medium">
                Welcome back, Administrator. Overview of the entire multi-tenant ecosystem.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Link href="/super-admin/security">
                <Button variant="outline" className="rounded-xl font-bold">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Hub
                </Button>
            </Link>
            <Link href="/super-admin/tenants">
                <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Launch New Tenant
                </Button>
            </Link>
        </div>
      </div>

      {/* Primary Metrics */}
      <AdminStats stats={stats} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Tenants Section */}
        <Card className="lg:col-span-4 rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-black">Recent Tenants</CardTitle>
                    <CardDescription>Latest storefronts deployed to the platform.</CardDescription>
                </div>
                <Link href="/super-admin/tenants">
                    <Button variant="ghost" size="sm" className="font-bold text-indigo-600">
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    {recentTenants.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-2xl bg-muted/30">
                          <Store className="h-10 w-10 text-muted-foreground/30 mb-2" />
                          <span className="text-muted-foreground font-medium">No tenants active yet</span>
                       </div>
                    ) : (
                      recentTenants.map((tenant: any) => (
                        <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-200 group">
                           <div className="flex items-center gap-4">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg transition-transform group-hover:scale-110" 
                                style={{ 
                                    backgroundColor: tenant.themeConfig?.primaryColor || '#6366f1',
                                    backgroundImage: `linear-gradient(135deg, ${tenant.themeConfig?.primaryColor || '#6366f1'} 0%, #4338ca 100%)`
                                }}
                              >
                                  {(tenant.name || 'Tenant').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-base leading-none">{tenant.name}</p>
                                    <Badge variant="secondary" className="text-[10px] h-4 font-bold uppercase tracking-widest">{tenant.plan}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5">
                                      <Globe className="h-3 w-3 text-muted-foreground" />
                                      <p className="text-xs text-muted-foreground font-medium">{tenant.domain}</p>
                                  </div>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                               <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                   <CheckCircle2 className="h-3 w-3" />
                                   Healthy
                               </div>
                               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                  {new Date(tenant.createdAt).toLocaleDateString()}
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
                        <CardTitle className="text-lg font-bold">System Status</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400">Real-time platform infrastructure health.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-medium">API Gateway</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400">Operational</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-medium">Database Cluster</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400">Optimal (12ms)</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-amber-500" />
                              <span className="text-sm font-medium">Worker Nodes</span>
                          </div>
                          <span className="text-xs font-bold text-amber-400">Scaling</span>
                      </div>
                 </CardContent>
            </Card>

            <Card className="rounded-3xl border-foreground/5 shadow-sm bg-linear-to-br from-indigo-600 to-indigo-800 text-white">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Tenant Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="opacity-80">Enterprise Tenants</span>
                            <span className="font-black">12%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[12%]" />
                        </div>
                        <div className="flex items-center justify-between text-sm mt-4">
                            <span className="opacity-80">Basic/Pro Storefronts</span>
                            <span className="font-black">88%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-300 w-[88%]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-black text-rose-900 dark:text-rose-400 text-sm">Critical Warning</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-500/80 mt-1 font-medium leading-relaxed">
                        SSL certificate for <strong>master-domain.com</strong> expires in 3 days. Action required.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
