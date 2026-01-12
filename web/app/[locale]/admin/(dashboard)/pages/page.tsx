/**
 * =====================================================================
 * PAGES MANAGEMENT - QUẢN LÝ DANH SÁCH TRANG TÙY CHỈNH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là nơi quản lý tất cả các trang CMS được tạo bởi Page Builder.
 * 1. SERVER ACTION: Sử dụng getPagesAction() để fetch danh sách trang ngay trên server.
 * 2. CLIENT INTERACTION: Truyền dữ liệu vào PagesListClient để handle việc lọc/tìm kiếm. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

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
    <div className="space-y-10 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Page Management"
        subtitle="Manage your store's dynamic pages and CMS content with our real-time builder."
        icon={<Layout className="text-indigo-500 fill-indigo-500/10" />}
      />

      <PagesListClient initialPages={pages} />
    </div>
  );
}
