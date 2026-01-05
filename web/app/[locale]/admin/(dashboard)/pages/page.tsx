import { getPagesAction } from "@/features/admin/actions";
import {
  AdminPageHeader
} from "@/features/admin/components/admin-page-components";
import { PagesListClient } from "@/features/admin/components/pages-list-client";
import { Layout } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminPagesPage() {
  const t = await getTranslations("admin");
  const pagesRes = await getPagesAction();
  const pages = "data" in pagesRes ? pagesRes.data || [] : [];

  return (
    <div className="space-y-10 px-4 md:px-0">
      <AdminPageHeader
        title="Page Management"
        subtitle="Manage your store's dynamic pages and CMS content with our real-time builder."
        icon={<Layout className="h-6 w-6 stroke-[1.5]" />}
      />

      <PagesListClient initialPages={pages} />
    </div>
  );
}
