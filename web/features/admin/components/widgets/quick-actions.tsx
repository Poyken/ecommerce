"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Link } from "@/i18n/routing";
import { Package, Palette, ShoppingBag, Ticket, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =====================================================================
 * QUICK ACTIONS - Các lối tắt quản trị nhanh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA-DRIVEN UI:
 * - Danh sách các hành động được định nghĩa trong mảng `actions`.
 * - Giúp việc thêm/bớt hoặc thay đổi icon, màu sắc trở nên cực kỳ dễ dàng mà không cần sửa cấu trúc JSX.
 *
 * 2. STYLING STRATEGY:
 * - Mỗi action có bộ màu riêng (`color`, `bg`, `border`) để phân biệt trực quan các khu vực quản lý.
 * - Sử dụng `border-dashed` (viền đứt đoạn) tạo cảm giác nhẹ nhàng, không bị nặng nề như viền liền.
 *
 * 3. INTERACTIVE EFFECTS:
 * - `group-hover:scale-110`: Khi di chuột vào card, icon sẽ phóng to nhẹ, tạo phản hồi thị giác tốt. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

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
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <GlassCard
            className={`p-4 hover:bg-white/5 transition-all duration-300 group ${action.border}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}
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
