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
 * - Individual Tenant Oversight: Cung cấp khả năng "soi chi tiết" vào từng cửa hàng cụ thể để hỗ trợ kỹ thuật, xử lý khiếu nại hoặc kiểm tra tính hợp lệ của việc sử dụng dịch vụ.
 * - Specialized Store Management: Cho phép Super Admin cấu hình các cài đặt đặc thù cho từng chủ shop (như giới hạn băng thông, gói cước tùy chỉnh) mà bản thân Admin của shop đó không thể tự thực hiện.

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
