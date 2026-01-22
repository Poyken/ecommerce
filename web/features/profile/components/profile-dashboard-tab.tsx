

"use client";

import { getAvailableCouponsAction } from "@/features/coupons/actions";
import { getMyOrdersAction } from "@/features/orders/actions";
import { getWishlistCountAction } from "@/features/wishlist/actions";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { User } from "@/types/models";
import { m } from "@/lib/animations";
import { Heart, ShoppingBag, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface ProfileDashboardTabProps {
  user: User;
  onTabChange: (tab: string) => void;
}

export function ProfileDashboardTab({
  user,
  onTabChange,
}: ProfileDashboardTabProps) {
  const t = useTranslations("profile.dashboard");
  const tTabs = useTranslations("profile.tabs");
  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    vouchers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, wishlistRes, vouchersRes] = await Promise.all([
          getMyOrdersAction(),
          getWishlistCountAction(),
          getAvailableCouponsAction(),
        ]);

        setStats({
          orders:
            ordersRes.success && ordersRes.data ? ordersRes.data.length : 0,
          wishlist:
            wishlistRes.success && wishlistRes.data
              ? (wishlistRes.data as any).count
              : 0,
          vouchers:
            vouchersRes.success && vouchersRes.data
              ? vouchersRes.data.length
              : 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      id: "orders",
      label: tTabs("orders"),
      value: stats.orders,
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "wishlist",
      label: tTabs("wishlist"),
      value: stats.wishlist,
      icon: Heart,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "vouchers",
      label: tTabs("vouchers"),
      value: stats.vouchers,
      icon: Ticket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("welcome", { name: user.firstName })}
        </h2>
        <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <m.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onTabChange(stat.id)}
              className="cursor-pointer"
            >
              <GlassCard className="p-6 flex items-center gap-6 hover:bg-white/10 transition-all group border-transparent hover:border-white/20">
                <div
                  className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold tabular-nums">
                    {stat.value}
                  </p>
                </div>
              </GlassCard>
            </m.div>
          );
        })}
      </div>

      {/* Account Overview */}
      <GlassCard className="p-8">
        <h3 className="text-xl font-semibold mb-6">{t("accountOverview")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("fullName")}
              </p>
              <p className="font-medium text-lg">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("email")}</p>
              <p className="font-medium text-lg">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col justify-end items-start md:items-end">
            <GlassButton
              onClick={() => onTabChange("account")}
              className="bg-primary/10 text-primary hover:bg-primary/20"
            >
              {t("editProfile")}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
