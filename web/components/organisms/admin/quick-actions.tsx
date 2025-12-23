"use client";

import { GlassCard } from "@/components/atoms/glass-card";
import { Package, ShoppingBag, Ticket, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

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
 * - `group-hover:scale-110`: Khi di chuột vào card, icon sẽ phóng to nhẹ, tạo phản hồi thị giác tốt.
 * =====================================================================
 */

export function QuickActions() {
  const t = useTranslations("admin");

  const actions = [
    {
      label: t("quickActions.manageProducts"),
      icon: Package,
      href: "/admin/products",
      color: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: t("quickActions.manageOrders"),
      icon: ShoppingBag,
      href: "/admin/orders",
      color: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: t("quickActions.manageUsers"),
      icon: Users,
      href: "/admin/users",
      color: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: t("quickActions.manageCoupons"),
      icon: Ticket,
      href: "/admin/coupons",
      color: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.label} href={action.href as any}>
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
