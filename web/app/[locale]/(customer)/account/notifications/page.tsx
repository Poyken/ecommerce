

import { NotificationsClient } from "./notifications-client";
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
