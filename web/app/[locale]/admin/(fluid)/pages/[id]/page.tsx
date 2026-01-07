/**
 * =====================================================================
 * PAGE BUILDER - TRÌNH THIẾT KẾ TRANG TRỰC QUAN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này khởi tạo PageBuilderClient để Admin có thể kéo thả,
 * chỉnh sửa giao diện trang CMS theo thời gian thực.
 * =====================================================================
 */

import { getPageByIdAction } from "@/features/admin/actions";
import { PageBuilderClient } from "@/features/admin/components/page-builder-client";
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
