"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { Logo } from "@/features/layout/components/logo";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CreditCard,
  History,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useEffect, useState } from "react";

/**
 * =================================================================================================
 * SUPER ADMIN SIDEBAR - THANH ĐIỀU HƯỚNG QUẢN TRỊ VIÊN CẤP CAO
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PHÂN QUYỀN (PERMISSION BASED ENGINE):
 *    - Sidebar này không fix cứng (hardcode) tất cả các mục.
 *    - Nó kiểm tra quyền của User thông qua `useAuth().hasPermission()`.
 *    - Dù là Super Admin (có full quyền), ta vẫn viết code check quyền để tái sử dụng logic này
 *      cho các vai trò thấp hơn sau này (VD: Support, Moderator).
 *
 * 2. CẤU TRÚC 2 LỚP (GROUP -> ITEMS):
 *    - `sidebarItems` là mảng các nhóm (Overview, Tenancy, Platform System).
 *    - Mỗi nhóm chứa nhiều items con.
 *    - Logic render: Map Group -> Map Items.
 *
 * 3. RESPONSIVE (COLLAPSIBLE):
 *    - Sidebar có thể thu gọn (`isCollapsed`) để tiết kiệm diện tích trên màn hình nhỏ.
 *    - Khi thu gọn, chỉ hiện Icon, ẩn Text. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function SuperAdminSidebar() {
  // We might want specific translations for super-admin or reuse admin
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission } = useAuth();

  // Super Admin specific items
  // Since Super Admins have ALL permissions, we might not need to filter by permission strictly,
  // but it is good practice to keep it consistent.
  const sidebarItems = [
    {
      title: t("overview"),
      items: [
        {
          title: t("dashboard"),
          href: "/super-admin",
          icon: LayoutDashboard,
          permission: "dashboard:read",
        },
        {
          title: t("securityHub"),
          href: "/super-admin/security",
          icon: ShieldCheck,
          permission: "superAdmin:read",
        },
        {
          title: t("analytics"),
          href: "/super-admin/analytics",
          icon: BarChart3,
          permission: "dashboard:read",
        },
        {
          title: t("chat") || "Chat",
          href: "/super-admin/chat",
          icon: MessageSquare,
          permission: "dashboard:read",
        },
      ],
    },
    {
      title: t("tenancy"),
      items: [
        {
          title: t("tenants"),
          href: "/super-admin/tenants",
          icon: Store,
          permission: "tenant:read",
        },
        {
          title: t("plans") || "Plans",
          href: "/super-admin/plans",
          icon: Package,
          permission: "tenant:read",
        },
        {
          title: t("subscriptions"),
          href: "/super-admin/subscriptions",
          icon: CreditCard,
          permission: "superAdmin:read",
        },
        {
          title: "Invoices",
          href: "/super-admin/invoices",
          icon: Receipt,
          permission: "superAdmin:read",
        },
      ],
    },
    {
      title: t("platformSystem"),
      items: [
        {
          title: t("roles"),
          href: "/super-admin/roles",
          icon: Shield,
          permission: "role:read",
        },
        {
          title: t("permissions"),
          href: "/super-admin/permissions",
          icon: Settings,
          permission: "permission:read",
        },
        {
          title: t("users"),
          href: "/super-admin/users",
          icon: Users,
          permission: "user:read",
        },
        {
          title: t("auditLogs"),
          href: "/super-admin/audit-logs",
          icon: History,
          permission: "auditLog:read",
        },
        {
          title: t("settings"),
          href: "/super-admin/settings",
          icon: Settings,
          permission: "permission:read",
        },
      ],
    },
  ];

  // We filter items, though Super Admin has everything.
  const filteredSidebarItems = sidebarItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.permission ? hasPermission(item.permission) : true
      ),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      className={cn(
        "z-20 border-r border-border bg-background/60 backdrop-blur-2xl flex flex-col h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div
        className={cn(
          "h-16 px-4 border-b border-border flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <Logo
          href="/super-admin"
          collapsed={isCollapsed}
          className={cn(
            "transition-all duration-300",
            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("h-8 w-8", !isCollapsed && "ml-auto")}
        >
          {isCollapsed ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 no-scrollbar">
        {filteredSidebarItems.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 whitespace-nowrap">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <TypedLink
                    key={item.href}
                    href={item.href as AppRoute}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 group relative overflow-hidden mb-1",
                      isActive
                        ? "text-primary-foreground bg-primary shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors shrink-0",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap">{item.title}</span>
                    )}
                  </TypedLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <TypedLink
          href={"/" as AppRoute}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary bg-secondary border border-border hover:bg-primary hover:text-primary-foreground transition-all duration-200 group",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Back to Store" : undefined}
        >
          <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap font-bold">{t("backToStore")}</span>
          )}
        </TypedLink>
        <TypedLink
          href={"/admin" as AppRoute}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary bg-secondary border border-border hover:bg-primary hover:text-primary-foreground transition-all duration-200 group mt-2",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Tenant Admin" : undefined}
        >
          <LayoutDashboard className="h-5 w-5 group-hover:scale-110 transition-transform shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap font-bold">
              {t("tenantAdmin") || "Tenant Admin"}
            </span>
          )}
        </TypedLink>
      </div>
    </aside>
  );
}
