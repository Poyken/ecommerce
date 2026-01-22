

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";
import { BarChart3, TrendingUp, Users, Target, Activity } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BusinessAnalyticsPage() {
  const t = useTranslations("superAdmin.analytics");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<BarChart3 className="text-sky-500 fill-sky-500/20" />}
        variant="sky"
        stats={[
          { label: "Active Tenants", value: "2,450", variant: "sky" },
          { label: "Growth", value: "+12%", variant: "emerald" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {t("stats.activeTenants")}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              2,450
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-12 w-12 text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("stats.newStores")}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              +42
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-12 w-12 text-rose-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {t("stats.churnRate")}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-rose-600 dark:text-rose-400">
              1.2%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-3xl border-foreground/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="h-12 w-12 text-amber-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t("stats.avgLtv")}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-amber-600 dark:text-amber-400">
              $840.00
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-[40px] border-foreground/5 shadow-sm min-h-[400px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-dashed relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="text-center space-y-4 relative z-10">
          <div className="h-20 w-20 rounded-3xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-12 transition-transform duration-500">
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">
            {t("comingSoon.title")}
          </h3>
          <p className="text-muted-foreground max-w-xs mx-auto font-medium">
            {t("comingSoon.description")}
          </p>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Under development
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
