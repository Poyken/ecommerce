"use client";

import { AlertCircle, Check, Clock, Edit, Eye, RotateCcw, Search, Truck, X, RefreshCw, Loader2, Package, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { cn, formatDate } from "@/lib/utils";
import { ReturnRequest, ReturnStatus } from "@/types/models";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { UpdateReturnStatusDialog } from "@/features/admin/components/returns/update-return-status-dialog";

export function ReturnsClient({
  returns,
  total,
  page,
  limit,
  counts,
  currentStatus = "all",
}: {
  returns: ReturnRequest[];
  total: number;
  page: number;
  limit: number;
  counts?: Record<string, number>;
  currentStatus?: string;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const canRead = hasPermission("return_request:read"); // Standard RMA permission
  const canUpdate = hasPermission("return_request:update");

  const {
    searchTerm,
    setSearchTerm,
    isPending: isTablePending,
    handleFilterChange,
  } = useAdminTable("/admin/returns");

  const handleStatusChange = (status: string) => {
    handleFilterChange("status", status);
  };

  const getStatusIcon = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />;
      case "APPROVED": return <Check className="h-4 w-4" />;
      case "WAITING_FOR_RETURN": return <Package className="h-4 w-4" />;
      case "IN_TRANSIT": return <Truck className="h-4 w-4" />;
      case "RECEIVED": return <Inbox className="h-4 w-4" />;
      case "INSPECTING": return <RefreshCw className="h-4 w-4" />;
      case "REFUNDED": return <RotateCcw className="h-4 w-4" />;
      case "REJECTED": return <X className="h-4 w-4" />;
      case "CANCELLED": return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("returns.management")}
        subtitle={t("showing", { count: returns.length, total: counts?.total || total, item: t("returns.title") })}
        icon={<RotateCcw className="text-purple-600 fill-purple-600/10" />}
        stats={[
          { label: "total", value: counts?.total || total, variant: "default" },
          { label: "pending", value: counts?.PENDING || 0, variant: "warning" },
          { label: "inspecting", value: counts?.INSPECTING || 0, variant: "info" },
          { label: "refunded", value: counts?.REFUNDED || 0, variant: "success" },
        ]}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={currentStatus}
          onValueChange={handleStatusChange}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit overflow-x-auto no-scrollbar">
            <TabsTrigger value="all" className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs transition-all gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">
              All <Badge variant="outline" className="ml-1 h-5 px-1.5">{counts?.total || 0}</Badge>
            </TabsTrigger>
            {(["PENDING", "APPROVED", "IN_TRANSIT", "RECEIVED", "INSPECTING", "REFUNDED"] as ReturnStatus[]).map((s) => (
              <TabsTrigger key={s} value={s} className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs transition-all gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">
                {getStatusIcon(s)}
                {s}
                <Badge variant="outline" className="ml-1 h-5 px-1.5">{counts?.[s] || 0}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("returns.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-primary/20 transition-all font-medium"
          />
          {(isPending || isTablePending) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending || isTablePending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[150px]">{t("returns.idLabel")}</TableHead>
              <TableHead>{t("returns.customerLabel")}</TableHead>
              <TableHead>{t("returns.orderIdLabel")}</TableHead>
              <TableHead>{t("returns.typeLabel")}</TableHead>
              <TableHead>{t("returns.statusLabel")}</TableHead>
              <TableHead>{t("returns.dateLabel")}</TableHead>
              <TableHead className="text-right w-[100px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <AdminEmptyState
                    icon={RotateCcw}
                    title={t("returns.noFound")}
                    description="No return requests found matching your criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              returns.map((ret) => (
                <TableRow key={ret.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-medium text-xs">
                    #{ret.id.split("-")[0].toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{(ret as any).user?.firstName}</span>
                      <span className="text-xs text-muted-foreground">{(ret as any).user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    #{ret.orderId.split("-")[0].toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {ret.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ret.status} icon={getStatusIcon(ret.status)} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(ret.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => {
                            setSelectedReturn(ret);
                            setStatusDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => router.push(`/admin/returns/${ret.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Pagination */}
      {total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      {/* Status Update Dialog */}
      {selectedReturn && (
        <UpdateReturnStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          returnRequest={selectedReturn as any}
        />
      )}
    </div>
  );
}
