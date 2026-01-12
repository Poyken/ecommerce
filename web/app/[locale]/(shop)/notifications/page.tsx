/**
 * =====================================================================
 * NOTIFICATIONS PAGE - Trang thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này hiển thị danh sách tất cả thông báo của người dùng.
 * Sử dụng `NotificationsClient` để xử lý việc hiển thị và tương tác. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { NotificationsClient } from "@/app/[locale]/(shop)/notifications/notifications-client";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return {
    title: `${t("title")} | Luxe`,
    description: t("subtitle"),
  };
}

export default function NotificationsPage() {
  return <NotificationsClient />;
}
