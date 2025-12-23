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
import { NotificationBell } from "@/components/molecules/notification-bell";
import { Laptop, LogOut, Moon, Palette, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          {/* Page Title / Breadcrumbs - Refined */}
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/80">
            {t("adminPanel")}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 md:gap-5">
          <div className="flex items-center gap-2 pr-4 border-r border-foreground/10">
            <NotificationBell />
            <LanguageSwitcher />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 px-2 h-10 hover:bg-foreground/5 rounded-full transition-all"
              >
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {user.email}
                  </span>
                </div>
                <Avatar className="h-8 w-8 border border-foreground/10 shadow-sm">
                  <AvatarImage src={user.avatar} alt={user.firstName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-[10px]">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-foreground/10 shadow-2xl">
              <DropdownMenuLabel className="px-3 pt-3 pb-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest leading-none">
                    {t("myAccount")}
                  </p>
                  <p className="text-[10px] leading-none text-muted-foreground font-medium">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2 bg-foreground/5" />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="rounded-lg h-9">
                  <Palette className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold">{tCommon("theme")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="p-1 rounded-xl shadow-xl">
                    <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg h-9">
                      <Sun className="mr-3 h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold">{tCommon("light")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg h-9">
                      <Moon className="mr-3 h-4 w-4 text-primary" />
                      <span className="text-xs font-bold">{tCommon("dark")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg h-9">
                      <Laptop className="mr-3 h-4 w-4 text-primary/70" />
                      <span className="text-xs font-bold">{tCommon("system")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator className="my-2 bg-foreground/5" />
              
              <DropdownMenuItem 
                onClick={() => logoutAction()}
                className="rounded-lg h-9 text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-wider">{tCommon("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
