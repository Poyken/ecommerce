import { getAuditLogsAction } from "@/features/admin/actions";
import { AuditLogsClient } from "./audit-logs-client";



export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = (params?.search as string) || "";
  const filter = (params?.filter as string) || "all";

  const response = await getAuditLogsAction({
    page,
    limit: 20,
    search,
    filter,
  });

  if ("error" in response) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="max-w-md w-full p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center space-y-2">
          <h3 className="font-semibold text-destructive text-lg">
            Access Denied
          </h3>
          <p className="text-sm text-muted-foreground">
            {response.error === "Forbidden"
              ? "You do not have permission to view audit logs."
              : response.error}
          </p>
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
    />
  );
}
