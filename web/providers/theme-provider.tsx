"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * =====================================================================
 * THEME PROVIDER - Quản lý Dark Mode
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NEXT-THEMES:
 * - Thư viện giúp quản lý theme (light/dark/system) trong Next.js.
 * - Tự động lưu preference vào `localStorage`.
 * - Tránh hiện tượng "flash" (trang trắng hiện lên trước khi đổi sang dark mode).
 *
 * 2. CLASS STRATEGY:
 * - `attribute="class"`: Thêm class `.dark` vào thẻ `<html>` khi ở chế độ tối.
 * - Tailwind sẽ dựa vào class này để áp dụng các style `dark:...`.
 * =====================================================================
 */

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
