import { getPageByIdAction } from "@/features/admin/actions";
import { PageBuilderClient } from "@/features/admin/components/page-builder-client";
import { notFound } from "next/navigation";

interface PageBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default async function PageBuilderPage({ params }: PageBuilderPageProps) {
  const { id } = await params;
  const res = await getPageByIdAction(id);

  if (!res.data) {
    notFound();
  }

  return <PageBuilderClient page={res.data} />;
}
