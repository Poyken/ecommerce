import { getUsersAction } from "@/features/admin/actions";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationsAdminClient } from "./notifications-admin-client";

/**
 * =====================================================================
 * ADMIN NOTIFICATIONS PAGE - Quản lý thông báo (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRUNG TÂM THÔNG BÁO:
 * - Trang này quản lý việc gửi thông báo (Push Notifications) từ hệ thống tới người tiêu dùng.
 * - Admin có thể gửi thông báo cho tất cả người dùng hoặc một người dùng cụ thể.
 *
 * 2. DATA PREPARATION:
 * - Lấy danh sách 100 người dùng đầu tiên (`getUsersAction`) để hiển thị trong dropdown khi chọn người nhận.
 *
 * 3. METADATA:
 * - `generateMetadata`: Hàm này giúp tối ưu SEO và tiêu đề trang dựa trên ngôn ngữ đã chọn.
 * =====================================================================
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.notifications");
  return {
    title: `${t("title")} | Luxe Admin`,
  };
}

export default async function AdminNotificationsPage() {
  const usersResult = await getUsersAction({ page: 1, limit: 100 }).catch(
    () => {
      return { data: [] };
    }
  );
  const users = "data" in usersResult ? usersResult.data : [];

  return <NotificationsAdminClient users={(users as any) || []} />;
}
