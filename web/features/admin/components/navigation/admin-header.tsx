"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";
import { AdminNotificationBell } from "@/features/admin/components/navigation/admin-notification-bell";
import { logoutAction } from "@/features/auth/actions";
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
  title?: string;
}

export function AdminHeader({ user, title }: AdminHeaderProps) {
  const { setTheme } = useTheme();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/20 backdrop-blur-3xl">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
            {title || t("adminPanel")}
          </h2>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          <div className="flex items-center gap-2 pr-4 border-r border-border/10">
            <AdminNotificationBell />
            <LanguageSwitcher />
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border/10">
                  <UserAvatar 
                    src={user?.avatar} 
                    alt={user?.firstName} 
                    className="h-9 w-9"
                  />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-premium">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/5" />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4" />
                  <span>{tCommon("theme")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="glass-premium">
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

              <DropdownMenuSeparator className="bg-border/5" />

              <DropdownMenuItem
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive"
                onClick={async (e) => {
                  e.preventDefault();
                  if (isLoggingOut) return;
                  setIsLoggingOut(true);
                  try {
                    await logoutAction();
                  } finally {
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
