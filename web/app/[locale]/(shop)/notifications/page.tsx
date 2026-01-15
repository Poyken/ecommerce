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
 * - Customer Engagement Loop: Duy trì kết nối liên tục với khách hàng thông qua các thông báo về đơn hàng, khuyến mãi hoặc cập nhật hệ thống, giúp tăng tỷ lệ quay lại của người dùng.
 * - Real-time Retention: Thông báo tức thì giúp khách hàng không bỏ lỡ các ưu đãi chớp nhoáng (Flash Sale) hoặc thông tin vận chuyển quan trọng, nâng cao sự hài lòng đối với dịch vụ.

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
