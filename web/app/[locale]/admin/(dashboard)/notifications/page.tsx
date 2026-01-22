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
  const t = await getTranslations("admin.notifications");
  const usersResult = await getUsersAction({ page: 1, limit: 100 }).catch(
    () => {
      return { data: [] };
    }
  );
  const users = "data" in usersResult ? usersResult.data : [];

  return <NotificationsAdminClient users={(users as any) || []} />;
}
