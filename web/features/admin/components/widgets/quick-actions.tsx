"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Link } from "@/i18n/routing";
import { BarChart3, Box, FileText, Package, Palette, ShieldAlert, ShoppingBag, Ticket, Users } from "lucide-react";
import { useTranslations } from "next-intl";



export function QuickActions() {
  const t = useTranslations("admin");

  const actions = [
    {
      label: t("quickActions.manageProducts"),
      icon: Package,
      href: "/admin/products",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
    },
    {
      label: t("quickActions.manageOrders"),
      icon: ShoppingBag,
      href: "/admin/orders",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20 hover:border-sky-500/40",
    },
    {
      label: t("quickActions.manageUsers"),
      icon: Users,
      href: "/admin/users",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20 hover:border-violet-500/40",
    },
    {
      label: t("quickActions.manageCoupons"),
      icon: Ticket,
      href: "/admin/coupons",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20 hover:border-rose-500/40",
    },
    {
      label: t("quickActions.customizeAppearance"),
      icon: Palette,
      href: "/admin/pages",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20 hover:border-amber-500/40",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20 hover:border-indigo-500/40",
    },
    {
      label: "Inventory",
      icon: Box,
      href: "/admin/inventory",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20 hover:border-teal-500/40",
    },
    {
      label: "Audit & Security",
      icon: ShieldAlert,
      href: "/admin/audit-logs",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20 hover:border-orange-500/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <GlassCard
            className={`p-4 hover:bg-white/5 transition-all duration-300 group ${action.border}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${action.bg} ${action.color} transition-transform`}
              >
                <action.icon size={20} />
              </div>
              <span className="font-medium text-sm text-foreground">
                {action.label}
              </span>
            </div>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}
