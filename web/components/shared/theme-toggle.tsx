"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

/**
 * =====================================================================
 * THEME TOGGLE - Nút chuyển đổi Giao diện Tối/Sáng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NEXT-THEMES INTEGRATION:
 * - Sử dụng hook `useTheme` để thay đổi giá trị theme toàn cục.
 * - Hỗ trợ 3 chế độ: Light, Dark, và System (theo hệ điều hành).
 *
 * 2. ICON ANIMATIONS:
 * - Sử dụng CSS classes (`rotate`, `scale`) để tạo hiệu ứng xoay và phóng to/thu nhỏ khi chuyển đổi giữa icon Mặt trời và Mặt trăng.
 * - `dark:-rotate-90 dark:scale-0`: Ẩn icon Sun khi ở chế độ Dark.
 * - `dark:rotate-0 dark:scale-100`: Hiện icon Moon khi ở chế độ Dark. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function ThemeToggle() {
  const t = useTranslations("common");
  const { setTheme } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("sr.toggleTheme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
