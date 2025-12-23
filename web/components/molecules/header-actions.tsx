"use client";

import { logoutAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/atoms/avatar";
import { Button } from "@/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Link } from "@/i18n/routing";
import {
  Laptop,
  Loader2,
  LogOut,
  Moon,
  Palette,
  Sun,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

/**
 * =====================================================================
 * HEADER ACTIONS - Các hành động trên Header (User, Theme, Auth)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER PROFILE HOOK (`useUserProfile`):
 * - Tự động fetch thông tin user từ API nếu đã đăng nhập.
 * - Quản lý trạng thái loading và error một cách tập trung.
 *
 * 2. DROPDOWN MENU (Radix UI):
 * - Hiển thị menu xổ xuống khi click vào Avatar.
 * - Chứa các link quan trọng: Profile, Theme, Logout.
 *
 * 3. THEME SWITCHING:
 * - Sử dụng `next-themes` để thay đổi giữa Light, Dark và System mode.
 * - `DropdownMenuSub`: Menu con lồng nhau giúp giao diện gọn gàng hơn.
 *
 * 4. LOGOUT LOGIC:
 * - Khi logout, ta cần xóa `guest_cart` trong localStorage để tránh xung đột dữ liệu cũ.
 * - Dispatch event `cart_clear` để các component khác cập nhật UI ngay lập tức.
 * =====================================================================
 */

import { LanguageSwitcher } from "@/components/molecules/language-switcher";

interface HeaderActionsProps {
  initialUser?: any;
}

export function HeaderActions({ initialUser }: HeaderActionsProps) {
  const t = useTranslations("common");
  const { setTheme } = useTheme();
  // Use initialUser directly from props (already fetched by layout)
  const user = initialUser;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              {t("login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="cursor-pointer">
              {t("register")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <LanguageSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.firstName} />
              <AvatarFallback>
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="h-4 w-4" />
              <span>{t("profile") || "Profile"}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette className="h-4 w-4" />
              <span>{t("theme") || "Theme"}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4" />
                  <span>{t("light") || "Light"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4" />
                  <span>{t("dark") || "Dark"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="h-4 w-4" />
                  <span>{t("system") || "System"}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isLoggingOut}
            onClick={async (e) => {
              e.preventDefault();
              if (isLoggingOut) return;

              setIsLoggingOut(true);
              try {
                // Clear guest cart to prevent stale data
                localStorage.removeItem("guest_cart");
                window.dispatchEvent(new Event("guest_cart_updated"));
                // Force clear cart badge immediately
                window.dispatchEvent(new Event("cart_clear"));
                await logoutAction();
              } finally {
                // No need to set false as we redirect
              }
            }}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>{t("logout") || "Log out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
