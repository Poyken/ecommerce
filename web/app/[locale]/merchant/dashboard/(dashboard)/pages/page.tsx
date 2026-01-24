

import { getPagesAction } from "@/features/admin/actions";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";
import { PagesListClient } from "@/features/admin/components/core/pages-list-client";
import { Layout } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminPagesPage() {
  const t = await getTranslations("admin");
  const pagesRes = await getPagesAction();
  const pages = "data" in pagesRes ? pagesRes.data || [] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Page Management"
        subtitle="Manage your store's dynamic pages and CMS content with our real-time builder."
        icon={<Layout className="text-sky-500 fill-sky-500/10" />}
        variant="sky"
        stats={[
            { label: "Total Pages", value: pages.length, variant: "slate" },
            { label: "Published", value: pages.filter((p: any) => p.isPublished).length, variant: "emerald" }
        ]}
      />

      <PagesListClient initialPages={pages} />
    </div>
  );
}
