/**
 * =====================================================================
 * PROFILE SIDEBAR - Thanh điều hướng bên trái trang hồ sơ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NAVIGATION MENU:
 * - Chứa danh sách các liên kết đến các tab chức năng trong trang Profile.
 * - Highlight tab hiện tại bằng màu `primary` để người dùng dễ nhận biết.
 *
 * 2. USER SUMMARY:
 * - Hiển thị nhanh ảnh đại diện (hoặc chữ cái đầu), tên và email của người dùng.
 *
 * 3. LOGOUT INTEGRATION:
 * - Tích hợp nút đăng xuất ở cuối menu, xử lý việc xóa session và chuyển hướng về trang login. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).
 *
 * =====================================================================
 */

"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import {
  FileText,
  Heart,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  RotateCcw,
  Shield,
  ShoppingBag,
  Ticket,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export function ProfileSidebar({
  activeTab,
  onTabChange,
  user,
}: ProfileSidebarProps) {
  const t = useTranslations("profile.tabs");
  const tCommon = useTranslations("common");

  const menuItems = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "account",
      label: t("account"),
      icon: User,
    },
    {
      id: "orders",
      label: t("orders"),
      icon: ShoppingBag,
    },
    {
      id: "returns",
      label: "My Returns",
      icon: RotateCcw,
    },
    {
      id: "blogs",
      label: t("blogs"),
      icon: FileText,
    },
    {
      id: "wishlist",
      label: t("wishlist"),
      icon: Heart,
    },
    {
      id: "addresses",
      label: t("addresses"),
      icon: MapPin,
    },
    {
      id: "vouchers",
      label: t("vouchers"),
      icon: Ticket,
    },
    {
      id: "password",
      label: t("password"),
      icon: KeyRound,
    },
    {
      id: "security",
      label: t("security"),
      icon: Shield,
    },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      {/* User Summary Card */}
      <GlassCard className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20">
          {user.avatarUrl ? (
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <Image
                src={user.avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            (user.firstName?.[0] || "U").toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </GlassCard>

      {/* Navigation Menu */}
      <GlassCard className="p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {item.label}
            </button>
          );
        })}

        <div className="pt-2 mt-2 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            {tCommon("logout")}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
