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
