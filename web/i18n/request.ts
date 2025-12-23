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
 * - Sử dụng dynamic import để chỉ load file ngôn ngữ cần thiết, giúp giảm memory và tăng tốc độ.
 * =====================================================================
 */

import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Lấy locale từ request (được middleware xử lý và truyền vào)
  let locale = await requestLocale;

  // Đảm bảo locale hợp lệ, nếu không thì dùng mặc định
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Load file dịch tương ứng từ thư mục /messages
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
