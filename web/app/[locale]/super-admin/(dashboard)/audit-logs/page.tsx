// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// SUPER ADMIN AUDIT LOGS - NHẬT KÝ HOẠT ĐỘNG TOÀN NỀN TẢNG
// =================================================================================================
//
// Trang này cho phép Super Admin tra cứu lịch sử hoạt động (Audit Logs) của TOÀN BỘ hệ thống.
// Khác với Admin thường (chỉ xem được log của shop mình), Super Admin cần cái nhìn tổng quan
// để phát hiện các vấn đề bảo mật hoặc lỗi kỹ thuật ở cấp độ hạ tầng/nền tảng.
//
// LUỒNG DỮ LIỆU:
// 1. Nhận `searchParams` từ URL (page, search keyword, filter type).
// 2. Gọi Server Action `getAuditLogsAction`. Lưu ý: Action này cần đủ thông minh để biết
//    khi nào đang được gọi bởi Super Admin để trả dữ liệu global thay vì scoped theo tenant.
// 3. Access Control: Nếu API trả lỗi (403/Forbidden), hiển thị thông báo "Access Denied" trang trọng.
//
// TÁI SỬ DỤNG COMPONENT:
// - Chúng ta tái sử dụng `AuditLogsClient` của Admin thường, vì giao diện hiển thị log là tương tự.
// - Props `basePath` giúp điều hướng phân trang đúng về URL của Super Admin.
// ================================================================================================= 
import { AuditLogsClient } from "@/app/[locale]/admin/(dashboard)/audit-logs/audit-logs-client";
import { getAuditLogsAction } from "@/features/admin/domain-actions/security-actions";
import { getTranslations } from "next-intl/server";
import { AuditLog } from "@/types/models";

/**
 * =================================================================================================
 * SUPER ADMIN AUDIT LOGS - NHẬT KÝ HOẠT ĐỘNG TOÀN NỀN TẢNG
 * =================================================================================================
 */
export default async function SuperAdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = (params?.search as string) || "";
  const filter = (params?.filter as string) || "all";

  // In a real multi-tenant app, getAuditLogsAction for Super Admin might return logs across all tenants
  const response = await getAuditLogsAction({
    page,
    limit: 20,
    search,
    filter,
  });

  if (response.error) {
    const t = await getTranslations("superAdmin.auditLogs");
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="max-w-md w-full p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center space-y-2">
          <h3 className="font-semibold text-destructive text-lg">
            {t("accessDenied")}
          </h3>
          <p className="text-sm text-muted-foreground">{response.error}</p>
        </div>
      </div>
    );
  }

  const logs = response.data || [];
  const total = response.meta?.total || 0;

  return (
    <AuditLogsClient
      logs={logs as AuditLog[]}
      total={total}
      page={page}
      limit={20}
      basePath="/super-admin/audit-logs"
    />
  );
}
