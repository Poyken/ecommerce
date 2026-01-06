"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BusinessAnalyticsPage() {
  const t = useTranslations("superAdmin.analytics");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-muted-foreground font-medium">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-foreground/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("stats.activeTenants")}
            </CardDescription>
            <CardTitle className="text-2xl font-black">2,450</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-3xl border-foreground/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("stats.newStores")}
            </CardDescription>
            <CardTitle className="text-2xl font-black">+42</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-3xl border-foreground/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("stats.churnRate")}
            </CardDescription>
            <CardTitle className="text-2xl font-black">1.2%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-3xl border-foreground/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("stats.avgLtv")}
            </CardDescription>
            <CardTitle className="text-2xl font-black">$840.00</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-3xl border-foreground/5 shadow-sm min-h-[400px] flex items-center justify-center bg-slate-50 border-dashed">
        <div className="text-center space-y-2">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="font-bold text-slate-400">{t("comingSoon.title")}</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            {t("comingSoon.description")}
          </p>
        </div>
      </Card>
    </div>
  );
}
