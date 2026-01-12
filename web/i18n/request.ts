/**
 * =====================================================================
 * I18N REQUEST CONFIGURATION - Cấu hình xử lý request đa ngôn ngữ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. getRequestConfig:
 * - Hàm này chạy ở Server-side cho mỗi request.
 * - Nhiệm vụ: Xác định locale hiện tại và load file dịch (.json) tương ứng.
 *
 * 2. Dynamic Messages:
 * - Sử dụng dynamic import để chỉ load file ngôn ngữ cần thiết, giúp giảm memory và tăng tốc độ. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { set } from "lodash";

import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "./routing";

async function getTenantMessages(locale: string) {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost";
    // In server environment (Docker/Local), localhost:8080 usually works
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

    const res = await fetch(`${apiUrl}/pages/translations/${locale}`, {
      headers: { "x-tenant-domain": host },
      next: { revalidate: 60 },
    });

    if (!res.ok) return {};
    const json = await res.json();
    return json.data || json;
  } catch {
    return null; // Fail silently to default
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  const defaultMessages = (await import(`../messages/${locale}.json`)).default;
  const tenantMessages = await getTenantMessages(locale as string);

  const mergedMessages = { ...defaultMessages, ...tenantMessages };

  // Fix for "INVALID_KEY" error: Unflatten keys with dots
  const messages = {};
  Object.entries(mergedMessages).forEach(([key, value]) => {
    set(messages, key, value);
  });

  return {
    locale,
    messages,
  };
});
