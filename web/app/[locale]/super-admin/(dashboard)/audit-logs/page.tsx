import { AuditLogsClient } from "@/app/[locale]/admin/(dashboard)/audit-logs/audit-logs-client";
import { getAuditLogsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";

/**
 * =================================================================================================
 * SUPER ADMIN AUDIT LOGS - NHẬT KÝ HOẠT ĐỘNG TOÀN NỀN TẢNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SHARED CLIENT COMPONENT:
 *    - Tái sử dụng `AuditLogsClient` từ module Admin để đồng bộ về UI/UX.
 *    - Truyền `basePath="/super-admin/audit-logs"` để đảm bảo phân trang và search hoạt động đúng URL.
 *
 * 2. GLOBAL VISIBILITY:
 *    - Khác với Admin thường (chỉ xem log của 1 tenant), Super Admin xem được log của tất cả
 *      các hoạt động hệ thống (Cross-tenant logs).
 *
 * 3. ERROR HANDLING:
 *    - Hiển thị thông báo "Access Denied" trang nhã nếu backend trả về lỗi phân quyền.
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
  const response = await getAuditLogsAction(page, 20, search, filter);

  if ("error" in response) {
    const t = await getTranslations();
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="max-w-md w-full p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center space-y-2">
          <h3 className="font-semibold text-destructive text-lg">
            {t("superAdmin.auditLogs.accessDenied")}
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
      logs={logs as any[]}
      total={total}
      page={page}
      limit={20}
      basePath="/super-admin/audit-logs"
    />
  );
}
