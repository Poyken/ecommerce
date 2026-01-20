"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { Logo } from "@/features/layout/components/logo";
import { Link, usePathname } from "@/i18n/routing";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Box,
  History,
  Layout,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Ticket,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * ADMIN SIDEBAR - Thanh điều hướng quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COLLAPSIBLE LOGIC:
 * - `isCollapsed`: Trạng thái thu gọn/mở rộng của sidebar để tối ưu không gian làm việc.
 * - Tự động thu gọn trên màn hình nhỏ (< 768px) bằng `useEffect` lắng nghe sự kiện `resize`.
 *
 * 2. NAVIGATION GROUPS:
 * - Phân loại các mục quản lý thành từng nhóm: Overview, Product, User, Sales để dễ tìm kiếm.
 *
 * 3. PERMISSION-BASED RENDERING:
 * - `hasPermission`: Chỉ hiển thị các menu mà tài khoản Admin hiện tại có quyền truy cập.
 * - Đây là tính năng bảo mật quan trọng (RBAC). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function AdminSidebar() {
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission } = useAuth();

  const sidebarItems = [
    {
      title: t("overview"),
      items: [
        {
          title: t("dashboard"),
          href: "/admin",
          icon: LayoutDashboard,
          permission: "dashboard:view",
        },
        {
          title: t("notifications"),
          href: "/admin/notifications",
          icon: Bell,
          permission: "notification:read",
        },
        {
          title: "AI Agent",
          href: "/admin/agent",
          icon: Bot,
          permission: "dashboard:view",
        },
      ],
    },
    {
      title: t("productManagement"),
      items: [
        {
          title: t("brands"),
          href: "/admin/brands",
          icon: Tag,
          permission: "brand:read",
        },
        {
          title: t("categories"),
          href: "/admin/categories",
          icon: Box,
          permission: "category:read",
        },
        {
          title: t("products"),
          href: "/admin/products",
          icon: Package,
          permission: "product:read",
        },
        {
          title: t("skus"),
          href: "/admin/skus",
          icon: BarChart3,
          permission: "sku:read",
        },
      ],
    },
    {
      title: t("contentManagement"),
      items: [
        {
          title: t("blogs"),
          href: "/admin/blogs",
          icon: BookOpen,
          permission: "blog:read",
        },
        {
          title: t("pages"),
          href: "/admin/pages",
          icon: Layout,
          permission: "page:read",
        },
      ],
    },
    {
      title: t("userManagement"),
      items: [
        {
          title: t("users"),
          href: "/admin/users",
          icon: Users,
          permission: "user:read",
        },
        {
          title: t("auditLogs"),
          href: "/admin/audit-logs",
          icon: History,
          permission: "auditLog:read",
        },
        {
          title: t("roles"),
          href: "/admin/roles",
          icon: Shield,
          permission: "role:read",
        },
        {
          title: t("permissions"),
          href: "/admin/permissions",
          icon: Settings,
          permission: "permission:read",
        },
        {
          title: t("chatSupport"),
          href: "/admin/chat",
          icon: MessageSquare,
          permission: "chat:read",
        },
      ],
    },
    {
      title: t("sales"),
      items: [
        {
          title: t("orders"),
          href: "/admin/orders",
          icon: ShoppingBag,
          permission: "order:read",
        },
        {
          title: t("coupons"),
          href: "/admin/coupons",
          icon: Ticket,
          permission: "coupon:read",
        },
        {
          title: t("reviews"),
          href: "/admin/reviews",
          icon: Star,
          permission: "review:read",
        },
      ],
    },
    {
      title: t("settings"),
      items: [
        {
          title: t("billing"),
          href: "/admin/billing",
          icon: Ticket, // Using Ticket as placeholder for Bill/Invoice
          permission: "settings:read",
        },
      ],
    },
  ];

  // Lọc các đề mục dựa trên quyền hạn của người dùng
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
        "z-20 border-r border-white/5 bg-background/60 backdrop-blur-2xl flex flex-col h-screen sticky top-0 transition-all duration-300",
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
          href="/admin"
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
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <TypedLink
                    key={item.href}
                    href={item.href as AppRoute}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 group relative overflow-hidden mb-1",
                      isActive
                        ? "text-white bg-[var(--aurora-purple)] shadow-[0_0_15px_-3px_var(--aurora-purple)]"
                        : "text-muted-foreground hover:text-white hover:bg-white/5",
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
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 border border-transparent hover:border-border group",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? t("backToStore") : undefined}
        >
          <Store className="h-5 w-5 group-hover:text-primary transition-colors shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap">{t("backToStore")}</span>
          )}
        </TypedLink>

        {hasPermission("super-admin:read") && (
          <TypedLink
            href={"/super-admin" as AppRoute}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all duration-200 group mt-2",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Platform Control" : undefined}
          >
            <Shield className="h-5 w-5 group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap font-bold">
                {t("platformControl")}
              </span>
            )}
          </TypedLink>
        )}
      </div>
    </aside>
  );
}
