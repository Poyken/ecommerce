/**
 * =====================================================================
 * TENANT DETAIL - XEM CHI TIẾT CỬA HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Hiển thị toàn bộ thông tin về một Tenant cụ thể: Cấu hình domain,
 * thông tin chủ shop, lịch sử gói cước và tình trạng hệ thống. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { getTenantAction } from "@/features/admin/actions";
import { TenantDetailClient } from "./tenant-detail-client";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getTenantAction(id);

  if (result.error || !result.data) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-muted-foreground">
          {result.error || "Tenant not found"}
        </p>
      </div>
    );
  }

  return <TenantDetailClient tenant={result.data} />;
}
