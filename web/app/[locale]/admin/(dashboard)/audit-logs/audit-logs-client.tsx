"use client";

/**
 * =====================================================================
 * AUDIT LOGS CLIENT - Nhật ký hoạt động hệ thống (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này hiển thị tất cả các hoạt động của admin trong hệ thống.
 * - Filter theo action type (CREATE, UPDATE, DELETE)
 * - Search theo resource hoặc user
 * - View detail với JSON payload
 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminActionBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/routing";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { format } from "date-fns";
import {
  Activity,
  Clock,
  Eye,
  FileText,
  Filter,
  Globe,
  Info,
  Search,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { AuditLog } from "@/types/models";

type FilterType = "all" | "create" | "update" | "delete";

export function AuditLogsClient({
  logs,
  total,
  page,
  limit,
  basePath = "/admin/audit-logs",
}: {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  basePath?: string;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const canRead = hasPermission("audit:read");

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "all"
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isPending, startTransition] = useTransition();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`${basePath}?${params.toString()}`);
      });
    }
  }, [debouncedSearchTerm, router, searchParams, basePath]);

  const getActionVariant = (
    action: string
  ): "success" | "info" | "danger" | "default" => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("create")) return "success";
    if (actionLower.includes("update") || actionLower.includes("patch"))
      return "info";
    if (actionLower.includes("delete")) return "danger";
    return "default";
  };

  // Generate human-readable description from log data
  const getLogDescription = (log: AuditLog): string => {
    const action = log.action?.toLowerCase() || "";
    const resource = log.resource || "item";
    const payload = (log.payload || {}) as any;

    // Try to extract meaningful info from payload
    const name =
      payload.name || payload.title || payload.code || payload.email || "";
    const id = payload.id ? `(ID: ${String(payload.id).slice(0, 8)}...)` : "";

    if (action.includes("create")) {
      return name
        ? `Created ${resource}: "${name}" ${id}`
        : `Created new ${resource} ${id}`;
    }
    if (action.includes("update") || action.includes("patch")) {
      const changes = payload.changes || payload.data || {};
      const changedFields = Object.keys(changes).slice(0, 3).join(", ");
      if (changedFields) {
        return `Updated ${resource}: ${changedFields} ${id}`;
      }
      return name
        ? `Updated ${resource}: "${name}" ${id}`
        : `Updated ${resource} ${id}`;
    }
    if (action.includes("delete")) {
      return name
        ? `Deleted ${resource}: "${name}" ${id}`
        : `Deleted ${resource} ${id}`;
    }
    if (action.includes("login")) {
      return `User logged in`;
    }
    if (action.includes("logout")) {
      return `User logged out`;
    }

    return `${action} on ${resource}`;
  };

  // Server-side filtering is now used, so we use logs directly
  const filteredLogs = logs;

  // Stats
  const createCount = logs.filter((l) =>
    l.action.toLowerCase().includes("create")
  ).length;
  const updateCount = logs.filter(
    (l) =>
      l.action.toLowerCase().includes("update") ||
      l.action.toLowerCase().includes("patch")
  ).length;
  const deleteCount = logs.filter((l) =>
    l.action.toLowerCase().includes("delete")
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("audit.management")}
        subtitle={t("showing", {
          count: filteredLogs.length,
          total: filter === "all" ? total : filteredLogs.length,
          item: t("audit.title").toLowerCase(),
        })}
        icon={<Activity className="text-rose-500 fill-rose-500/10" />}
        stats={[
          { label: "total", value: total, variant: "default" },
          { label: "creates", value: createCount, variant: "success" },
          { label: "updates", value: updateCount, variant: "info" },
          { label: "deletes", value: deleteCount, variant: "danger" },
        ]}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={filter}
          onValueChange={(v) => {
            const newFilter = v as FilterType;
            setFilter(newFilter);
            startTransition(() => {
              const params = new URLSearchParams(searchParams.toString());
              if (newFilter !== "all") {
                params.set("filter", newFilter);
              } else {
                params.delete("filter");
              }
              params.set("page", "1");
              router.push(`${basePath}?${params.toString()}`);
            });
          }}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
            >
              <Filter className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Create
            </TabsTrigger>
            <TabsTrigger
              value="update"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Update
            </TabsTrigger>
            <TabsTrigger
              value="delete"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-rose-600 transition-all gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Delete
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("audit.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("audit.date")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("audit.user")}
                </div>
              </TableHead>
              <TableHead>{t("audit.action")}</TableHead>
              <TableHead>{t("audit.resource")}</TableHead>
              <TableHead className="w-[250px]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("audit.ipAddress")}
                </div>
              </TableHead>
              {canRead && (
                <TableHead className="text-right w-[100px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canRead ? 7 : 6}>
                  <AdminEmptyState
                    icon={Activity}
                    title={t("audit.noFound")}
                    description="No activity logs found matching your criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(log.createdAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {log.user.firstName?.[0]}
                          {log.user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.user.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">
                        System
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AdminActionBadge
                      label={log.action}
                      variant={getActionVariant(log.action)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm font-medium">
                      {log.resource}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p
                      className="text-sm text-muted-foreground max-w-[250px] truncate"
                      title={getLogDescription(log)}
                    >
                      {getLogDescription(log)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {log.ipAddress || "N/A"}
                    </code>
                  </TableCell>
                  {canRead && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>
      {/* Pagination with page numbers - only show when needed */}
      {filteredLogs.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}
      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {t("audit.details")}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("audit.date")}
                  </p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.createdAt), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("audit.user")}
                  </p>
                  <p className="font-medium">
                    {selectedLog.user
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}`
                      : "System"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("audit.action")}
                  </p>
                  <AdminActionBadge
                    label={selectedLog.action}
                    variant={getActionVariant(selectedLog.action)}
                  />
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("audit.resource")}
                  </p>
                  <p className="font-medium capitalize">
                    {selectedLog.resource}
                  </p>
                </div>
              </div>

              {/* Payload */}
              <div>
                <p className="text-sm font-medium mb-2">Payload / Changes</p>
                <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
                  <pre className="text-xs text-emerald-400">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* IP & User Agent */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    IP Address
                  </p>
                  <code className="text-sm">
                    {selectedLog.ipAddress || "N/A"}
                  </code>
                </div>
                {selectedLog.userAgent && (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">
                      User Agent
                    </p>
                    <p className="text-xs break-all text-muted-foreground">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
