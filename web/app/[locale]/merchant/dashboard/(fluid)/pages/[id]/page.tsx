

import { getPageByIdAction } from "@/features/admin/actions";
import { PageBuilderClient } from "@/features/admin/components/core/page-builder-client";
import { notFound, redirect } from "next/navigation";

interface PageBuilderPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function PageBuilderPage({
  params,
}: PageBuilderPageProps) {
  const { id, locale } = await params;
  const res = await getPageByIdAction(id);

  if (!res.data) {
    redirect(`/${locale}/admin/pages`);
  }

  return <PageBuilderClient page={res.data} />;
}
