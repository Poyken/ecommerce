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
 * 1. NEXT-THEMES LIBRARY:
 * - Thay vì tự viết logic đọc/ghi LocalStorage và toggle class `dark`, ta dùng thư viện này.
 * - Lợi ích lớn nhất: Ngăn chặn "FOUC/Flash" (Trang web nháy sáng 1 tíc tắc rồi mới chuyển tối).
 * - Nó tự động inject script nhỏ vào thẻ `<head>` để set class ngay khi HTML parse, trước cả khi React hydrate.
 *
 * 2. CONFIGURATION:
 * - `attribute="class"`: Chế độ này thêm class `.dark` vào thẻ `<html>` thay vì dùng dataset `data-theme`.
 * - Tương thích tốt nhất với Tailwind CSS (`darkMode: "class"`).
 *
 * 3. COMPOSITION (Component Wrapping):
 * - Đây là một Wrapper Component, nó bao bọc toàn bộ App để cung cấp Context Theme xuống dưới.
 * =====================================================================
 */

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
