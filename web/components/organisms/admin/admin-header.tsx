"use client";

import { logoutAction } from "@/actions/auth";
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
import { LanguageSwitcher } from "@/components/molecules/language-switcher";
import { AdminNotificationBell } from "@/components/organisms/admin/admin-notification-bell";
import { Laptop, LogOut, Moon, Palette, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

interface AdminHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

/**
 * =====================================================================
 * ADMIN HEADER - Header cho trang quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * FEATURES:
 * 1. Theme Toggle:
 *    - Sử dụng `useTheme` hook từ `next-themes`.
 *    - Cho phép chuyển đổi Light/Dark/System mode.
 *
 * 2. Language Switcher:
 *    - Cho phép chuyển đổi giữa EN/VI trong admin panel.
 *
 * 3. User Dropdown:
 *    - Sử dụng `DropdownMenu` từ Shadcn UI.
 *    - Hiển thị thông tin user và nút Logout.
 *    - `logoutAction` được gọi khi click Logout (Server Action).
 *
 * STYLING:
 * - `sticky top-0`: Giữ header luôn ở trên cùng khi scroll.
 * - `backdrop-blur-md`: Tạo hiệu ứng mờ nền (Glassmorphism).
 * =====================================================================
 */
export function AdminHeader({ user }: AdminHeaderProps) {
  const { setTheme } = useTheme();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/5 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          {/* Page Title / Breadcrumbs - Refined */}
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/80">
            {t("adminPanel")}
          </h2>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          <div className="flex items-center gap-2 pr-4 border-r border-foreground/10">
            <AdminNotificationBell />
            <LanguageSwitcher />
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full p-0 overflow-hidden"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.firstName} />
                  <AvatarFallback className="text-sm">
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
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4" />
                  <span>{tCommon("theme")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="h-4 w-4" />
                      <span>{tCommon("light")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="h-4 w-4" />
                      <span>{tCommon("dark")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Laptop className="h-4 w-4" />
                      <span>{tCommon("system")}</span>
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
                    await logoutAction();
                  } finally {
                    // Redirect will handle it
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>{tCommon("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
