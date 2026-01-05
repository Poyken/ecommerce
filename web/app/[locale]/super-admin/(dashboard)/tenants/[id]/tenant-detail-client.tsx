"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/routing";
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
    Zap
} from "lucide-react";

export function TenantDetailClient({ tenant }: { tenant: Tenant }) {
  const router = useRouter();

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
         <Link href="/super-admin" className="hover:text-foreground">SuperAdmin</Link>
         <span>/</span>
         <Link href="/super-admin/tenants" className="hover:text-foreground">Tenants</Link>
         <span>/</span>
         <span className="text-foreground font-medium">{tenant.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-5">
            <div 
                className="w-20 h-20 rounded-2xl border-4 border-background flex items-center justify-center text-2xl font-black text-white shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300"
                style={{ 
                    backgroundColor: tenant.themeConfig?.primaryColor || '#6366f1',
                    backgroundImage: `linear-gradient(135deg, ${tenant.themeConfig?.primaryColor || '#6366f1'} 0%, #4338ca 100%)`
                }}
            >
                {(tenant.name || 'Tenant').substring(0, 2).toUpperCase()}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight">{tenant.name}</h1>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active
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
                        <span className="text-sm font-medium uppercase tracking-wider">{tenant.plan}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="rounded-xl border-foreground/10 hover:bg-muted font-bold">
                <Settings className="mr-2 h-4 w-4" />
                Settings
            </Button>
            <Button variant="outline" className="rounded-xl border-foreground/10 hover:bg-muted font-bold text-rose-500 hover:text-rose-600">
                <Lock className="mr-2 h-4 w-4" />
                Suspend
            </Button>
            <Button 
                onClick={() => {
                    const protocol = window.location.protocol;
                    const host = window.location.host;
                    const isLocal = host.includes('localhost');
                    let targetDomain = tenant.domain;
                    
                    // For local development testing (e.g., tenant1.localhost:3000)
                    if (isLocal && !targetDomain.includes(':')) {
                        const port = host.split(':')[1] || '3000';
                        targetDomain = `${targetDomain}:${port}`;
                    }
                    
                    window.open(`${protocol}//${targetDomain}/admin`, '_blank');
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 font-bold px-6"
            >
                <Zap className="mr-2 h-4 w-4 fill-current" />
                Enter Portal
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <div className="bg-muted/50 p-1 rounded-xl inline-flex mb-6">
                    <TabsList className="bg-transparent border-none">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold">Overview</TabsTrigger>
                        <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold">Plan & Billing</TabsTrigger>
                        <TabsTrigger value="usage" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold">Usage Metrics</TabsTrigger>
                        <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold">Audit Logs</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 mt-0">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="rounded-2xl border-foreground/5 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Store Revenue</CardTitle>
                                <CreditCard className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">$45,231</div>
                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-1">
                                    <Activity className="h-3 w-3" />
                                    +12.5% vs last month
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-foreground/5 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Total Orders</CardTitle>
                                <Activity className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">1,482</div>
                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-1">
                                    <Activity className="h-3 w-3" />
                                    +5.2% vs last month
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-foreground/5 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Customers</CardTitle>
                                <Users className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">8,902</div>
                                <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold mt-1">
                                    <Activity className="h-3 w-3" />
                                    -0.4% vs last month
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-2xl border-foreground/5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Platform Performance</CardTitle>
                            <CardDescription>Server-side metrics for this specific tenant instance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-indigo-500" />
                                            <span className="font-medium">Avg. Response Time</span>
                                        </div>
                                        <span className="font-bold">142ms</span>
                                    </div>
                                    <Progress value={20} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-emerald-500" />
                                            <span className="font-medium">DB Connection Load</span>
                                        </div>
                                        <span className="font-bold">15%</span>
                                    </div>
                                    <Progress value={15} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-orange-500" />
                                            <span className="font-medium">Assets Delivery</span>
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
                            <CardTitle className="text-lg font-bold">Recent Activities</CardTitle>
                        </CardHeader>
                        <div className="divide-y divide-foreground/5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-background border flex items-center justify-center">
                                            {i === 1 ? <Users className="h-4 w-4 text-blue-500" /> : <Activity className="h-4 w-4 text-amber-500" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{i === 1 ? 'Admin User Login' : 'Bulk Product Update'}</p>
                                            <p className="text-xs text-muted-foreground">{i === 1 ? 'admin@store.com' : 'via API'}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">
                                        {i * 15} mins ago
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="usage" className="space-y-6 mt-0">
                    <Card className="rounded-2xl border-foreground/5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Resource Usage</CardTitle>
                            <CardDescription>Consumption relative to the <strong>{tenant.plan}</strong> tier limits.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                             <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black">Active Products</p>
                                        <p className="text-xs text-muted-foreground">{usage.products} of {planLimits.products} items</p>
                                    </div>
                                    <span className="text-sm font-black">{Math.round((usage.products / planLimits.products) * 100)}%</span>
                                </div>
                                <Progress value={(usage.products / planLimits.products) * 100} className="h-2" />
                             </div>

                             <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black">Storage (Images & Media)</p>
                                        <p className="text-xs text-muted-foreground">{usage.storage}GB of {planLimits.storage}GB</p>
                                    </div>
                                    <span className="text-sm font-black">{Math.round((usage.storage / planLimits.storage) * 100)}%</span>
                                </div>
                                <Progress value={(usage.storage / planLimits.storage) * 100} className="h-2 bg-muted shadow-inner" />
                             </div>

                             <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black">Monthly Bandwidth</p>
                                        <p className="text-xs text-muted-foreground">{usage.bandwidth}GB of {planLimits.bandwidth}GB</p>
                                    </div>
                                    <span className="text-sm font-black">{Math.round((usage.bandwidth / planLimits.bandwidth) * 100)}%</span>
                                </div>
                                <Progress value={(usage.bandwidth / planLimits.bandwidth) * 100} className="h-2" />
                             </div>

                             <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold text-amber-800 dark:text-amber-400">Approaching Limits</p>
                                    <p className="text-amber-700 dark:text-amber-500/80">This tenant is using 65% of their product limit. Consider suggesting an upgrade to the PRO plan.</p>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="subscription">
                    <div className="space-y-4">
                        <Card className="rounded-2xl border-indigo-500/20 bg-indigo-500/[0.02] shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Subscription Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-background border rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                            <Zap className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl">{tenant.plan}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">Renewal Date: {format(new Date(tenant.createdAt), 'dd MMM yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black">$49.00</p>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">per month</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" className="rounded-xl h-12 font-bold">Update Billing Plan</Button>
                                    <Button variant="outline" className="rounded-xl h-12 font-bold text-rose-500">Cancel Subscription</Button>
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
                      <CardTitle className="text-lg font-bold">Technical Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                       <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Tenant ID</p>
                           <p className="text-sm font-mono bg-muted p-2 rounded-lg break-all">{tenant.id}</p>
                       </div>
                       <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Public Domain</p>
                           <a href={`http://${tenant.domain}`} target="_blank" className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm group">
                               <span className="font-bold truncate">{tenant.domain}</span>
                               <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                           </a>
                       </div>
                       <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Deployment Date</p>
                           <p className="text-sm font-bold px-1">{format(new Date(tenant.createdAt), 'PPP')}</p>
                       </div>
                       <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Default Locale</p>
                           <Badge variant="secondary" className="font-bold">en-US</Badge>
                       </div>
                  </CardContent>
              </Card>

              <Card className="rounded-2xl border-foreground/5 shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-lg font-bold">DNS & Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                       <div className="flex items-center justify-between text-sm py-2 border-b border-foreground/5">
                           <div className="flex items-center gap-2">
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                               <span>SSL Certificate</span>
                           </div>
                           <span className="font-bold text-xs text-muted-foreground">Active</span>
                       </div>
                       <div className="flex items-center justify-between text-sm py-2 border-b border-foreground/5">
                           <div className="flex items-center gap-2">
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                               <span>DNS Records</span>
                           </div>
                           <span className="font-bold text-xs text-muted-foreground">Propagated</span>
                       </div>
                        <div className="flex items-center justify-between text-sm py-2">
                           <div className="flex items-center gap-2">
                               <Shield className="h-4 w-4 text-indigo-500" />
                               <span>DDoS Protection</span>
                           </div>
                           <span className="font-bold text-xs text-muted-foreground">Enabled</span>
                       </div>
                  </CardContent>
              </Card>

              <Card className="rounded-2xl border-indigo-500/20 bg-indigo-500/[0.03] shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-indigo-500" />
                        Local Setup Guide
                      </CardTitle>
                      <CardDescription>How to access this store on your machine.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                       <div className="text-sm space-y-2">
                           <p className="font-medium">Để truy cập được vào domain <code className="text-indigo-600 font-bold">{tenant.domain}</code> cục bộ:</p>
                           <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                               <li>Mở file <code className="bg-muted px-1 rounded">hosts</code> (Windows: <code className="text-[10px]">C:\Windows\System32\drivers\etc\hosts</code>)</li>
                               <li>Thêm dòng: <code className="bg-slate-900 text-slate-100 px-2 py-1 rounded block mt-1">127.0.0.1 {tenant.domain}</code></li>
                               <li>Lưu lại và nhấn nút <strong>Enter Portal</strong> phía trên.</li>
                           </ol>
                       </div>
                  </CardContent>
              </Card>

              <div className="p-6 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/10">
                  <h3 className="font-black text-lg">Platform Note</h3>
                  <p className="text-sm opacity-90 mt-2 leading-relaxed">
                      This tenant is a high-value customer. Escalated support is active. Priority 1 for any reported outages.
                  </p>
                  <Button variant="secondary" className="w-full mt-4 rounded-xl font-bold bg-white/20 hover:bg-white/30 text-white border-0">
                      Add New Note
                  </Button>
              </div>
          </div>
      </div>
    </div>
  );
}
