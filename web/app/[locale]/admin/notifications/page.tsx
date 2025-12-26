import { getUsersAction } from "@/features/admin/actions";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationsAdminClient } from "./notifications-admin-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.notifications");
  return {
    title: `${t("title")} | Luxe Admin`,
  };
}

export default async function AdminNotificationsPage() {
  const usersResult = await getUsersAction(1, 100).catch((err) => {
    console.error("[AdminNotificationsPage] Failed to fetch users:", err);
    return { data: [] };
  });
  const users = "data" in usersResult ? usersResult.data : [];

  return <NotificationsAdminClient users={(users as any) || []} />;
}
