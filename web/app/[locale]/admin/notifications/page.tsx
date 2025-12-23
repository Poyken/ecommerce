import { getUsersAction } from "@/actions/admin";
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
  const usersResult = await getUsersAction(1, 100); // Get first 100 users for selection
  const users = "data" in usersResult ? usersResult.data : [];

  return <NotificationsAdminClient users={users || []} />;
}
