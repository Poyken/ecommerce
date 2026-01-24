

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
