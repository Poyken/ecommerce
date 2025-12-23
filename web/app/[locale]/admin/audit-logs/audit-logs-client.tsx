"use client";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/auth-provider";
import { Info, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AuditLogsClient({
  logs,
  total,
  page,
  limit,
}: {
  logs: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const canRead = hasPermission("audit:read");

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [selectedLog, setSelectedLog] = useState<Record<string, any> | null>(
    null
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
      params.set("search", debouncedSearchTerm);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/audit-logs?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Only trigger on search term change

  const totalPages = Math.ceil(total / limit);

  const getActionColor = (action: string) => {
    if (action.includes("create"))
      return "bg-green-100 text-green-700 border-green-200";
    if (action.includes("update") || action.includes("patch"))
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (action.includes("delete"))
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("audit.management")}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t("showing", {
              count: logs.length,
              total,
              item: t("audit.title").toLowerCase(),
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder={t("audit.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <GlassCard className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("audit.date")}</TableHead>
              <TableHead>{t("audit.user")}</TableHead>
              <TableHead>{t("audit.action")}</TableHead>
              <TableHead>{t("audit.resource")}</TableHead>
              <TableHead>{t("audit.ipAddress")}</TableHead>
              {canRead && (
                <TableHead className="text-right">{t("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canRead ? 6 : 5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("audit.noFound")}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        System / Anon
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getActionColor(log.action.toLowerCase())}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{log.resource}</TableCell>
                  <TableCell className="text-xs text-gray-500 font-mono">
                    {log.ipAddress || "N/A"}
                  </TableCell>
                  {canRead && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {t("pagination.page", { current: page, total: totalPages })}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", (page - 1).toString());
                  router.push(`/admin/audit-logs?${params.toString()}`);
                }}
              >
                {t("pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", (page + 1).toString());
                  router.push(`/admin/audit-logs?${params.toString()}`);
                }}
              >
                {t("pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("audit.details")}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">{t("audit.date")}</p>
                  <p className="font-medium">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{t("audit.user")}</p>
                  <p className="font-medium">
                    {selectedLog.user
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}`
                      : "System"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{t("audit.action")}</p>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t("audit.resource")}</p>
                  <p className="font-medium capitalize">
                    {selectedLog.resource}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Payload / Changes</p>
                <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-green-400">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">User Agent</p>
                  <p className="text-xs font-mono text-gray-500 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
