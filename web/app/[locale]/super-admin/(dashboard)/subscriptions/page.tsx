"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function SubscriptionsPage() {
  const t = useTranslations();
  const subscriptions = [
    {
      id: "sub_1",
      tenant: "Organic Fruits",
      plan: "Pro",
      status: "Active",
      nextBilling: "2026-02-01",
      amount: "$49.00",
    },
    {
      id: "sub_2",
      tenant: "Tech Gadgets",
      plan: "Enterprise",
      status: "Active",
      nextBilling: "2026-02-05",
      amount: "$299.00",
    },
    {
      id: "sub_3",
      tenant: "Fashion Hub",
      plan: "Basic",
      status: "Past Due",
      nextBilling: "2026-01-02",
      amount: "$19.00",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {t("superAdmin.subscriptions.title")}
        </h1>
        <p className="text-muted-foreground font-medium">
          {t("superAdmin.subscriptions.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border-indigo-500/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">
              {t("superAdmin.subscriptions.stats.active")}
            </CardDescription>
            <CardTitle className="text-2xl font-black flex items-center justify-between">
              124
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-3xl border-indigo-500/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">
              {t("superAdmin.subscriptions.stats.pending")}
            </CardDescription>
            <CardTitle className="text-2xl font-black flex items-center justify-between">
              12
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-3xl border-indigo-500/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">
              {t("superAdmin.subscriptions.stats.avgLtv")}
            </CardDescription>
            <CardTitle className="text-2xl font-black flex items-center justify-between">
              $840.00
              <Zap className="h-5 w-5 text-indigo-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-3xl border-foreground/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-black">
            {t("superAdmin.subscriptions.list.title")}
          </CardTitle>
          <CardDescription>
            {t("superAdmin.subscriptions.list.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 border rounded-2xl bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{sub.tenant}</p>
                    <p className="text-xs text-muted-foreground">{sub.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {sub.plan}
                    </p>
                    <Badge
                      variant={
                        sub.status === "Active" ? "secondary" : "destructive"
                      }
                      className="text-[10px] font-bold"
                    >
                      {sub.status === "Active"
                        ? t("superAdmin.subscriptions.status.active")
                        : t("superAdmin.subscriptions.status.pastDue")}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{sub.amount}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {t("superAdmin.subscriptions.table.nextBilling", {
                        date: sub.nextBilling,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
