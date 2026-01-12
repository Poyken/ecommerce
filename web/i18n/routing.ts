/**
 * =====================================================================
 * I18N ROUTING CONFIGURATION - Cấu hình điều hướng đa ngôn ngữ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. defineRouting:
 * - Định nghĩa các ngôn ngữ được hỗ trợ (locales) và ngôn ngữ mặc định.
 * - Next-intl sẽ dựa vào đây để tạo ra các đường dẫn như /vi/about hoặc /en/about.
 *
 * 2. createNavigation:
 * - Tạo ra các bản sao của Link, useRouter, usePathname... nhưng có hiểu biết về locale.
 * - Khi dùng Link từ đây, bạn không cần truyền /vi/ vào href, nó sẽ tự động thêm dựa trên ngôn ngữ hiện tại. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Danh sách các ngôn ngữ được hệ thống hỗ trợ
  locales: ["en", "vi"],

  // Ngôn ngữ mặc định khi không có ngôn ngữ nào khớp trên URL
  defaultLocale: "en",
  localePrefix: "always",
});

// Các wrapper nhẹ quanh Next.js navigation APIs
// Giúp việc điều hướng luôn giữ đúng prefix ngôn ngữ trên URL
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
