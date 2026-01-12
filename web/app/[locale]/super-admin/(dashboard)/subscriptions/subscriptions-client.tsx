/**
 * =====================================================================
 * SUBSCRIPTIONS CLIENT - GIAO DIỆN QUẢN LÝ GÓI ĐĂNG KÝ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Chức năng chính:
 * 1. Hiển thị danh sách đăng ký của các cửa hàng.
 * 2. Hỗ trợ tìm kiếm, phân trang và lọc theo trạng thái.
 * 3. Cho phép hủy bỏ (Cancel) các gói cước vi phạm hoặc hết hạn.
 * =====================================================================
 */

"use client";

import { DataTablePagination } from "@/components/shared/data-table-pagination";
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
import {
  cancelSubscriptionAction,
  deleteSubscriptionAction,
} from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { Subscription } from "@/types/models";
import { format } from "date-fns";
import {
  Ban,
  Calendar,
  CreditCard,
  Edit2,
  MoreHorizontal,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionDialog } from "./subscription-dialog";

export function SubscriptionsClient({
  subscriptions,
  total,
  page,
  limit,
}: {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
}) {
  const t = useTranslations("superAdmin.subscriptions");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const { searchTerm, setSearchTerm, isPending } = useAdminTable(
    "/super-admin/subscriptions"
  );

  const openCancel = (sub: Subscription) => {
    setSelectedSub(sub);
    setCancelDialogOpen(true);
  };

  const openEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setEditDialogOpen(true);
  };

  const openDelete = (sub: Subscription) => {
    setSelectedSub(sub);
    setDeleteDialogOpen(true);
  };

  const statusMap = {
    true: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
    false: { label: "Inactive", className: "bg-slate-100 text-slate-700" },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle", { total })}
        icon={<CreditCard className="text-emerald-600 dark:text-emerald-400" />}
        stats={[
          {
            label: "Active",
            value: subscriptions.filter((s) => s.isActive).length,
            variant: "success",
          },
        ]}
      />

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder") || "Search tenant..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("table.tenant")}</TableHead>
              <TableHead>{t("table.plan")}</TableHead>
              <TableHead>{t("table.billing")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.nextBilling")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <AdminEmptyState
                    icon={CreditCard}
                    title={t("empty.title")}
                    description={t("empty.description")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{sub.tenant?.name || "Unknown Tenant"}</span>
                      <span className="text-xs text-muted-foreground">
                        {sub.tenant?.domain}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-sm">{sub.billingFrequency}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        statusMap[sub.isActive ? "true" : "false"].className
                      }
                      variant="secondary"
                    >
                      {statusMap[sub.isActive ? "true" : "false"].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sub.nextBillingDate), "dd/MM/yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(sub)}>
                          <Edit2 className="w-4 h-4 mr-2 text-indigo-500" />
                          Edit Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-amber-600 focus:text-amber-600"
                          onClick={() => openCancel(sub)}
                          disabled={!sub.isActive}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => openDelete(sub)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      {/* Dialogs */}
      <SubscriptionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        subscription={selectedSub}
      />

      {selectedSub && (
        <>
          <DeleteConfirmDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            title="Cancel Subscription"
            description={`Are you sure you want to cancel the subscription for "${selectedSub.tenant?.name}"? They will lose access at the end of the billing period.`}
            action={() => cancelSubscriptionAction(selectedSub.id)}
            successMessage="Subscription cancelled successfully"
            confirmLabel="Yes, Cancel Subscription"
          />

          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Subscription Entry"
            description={`DANGER: Are you sure you want to delete the subscription record for "${selectedSub.tenant?.name}"? This removes all billing linkage from the platform database.`}
            action={() => deleteSubscriptionAction(selectedSub.id)}
            successMessage="Subscription record deleted"
            confirmLabel="Delete Permanently"
          />
        </>
      )}
    </div>
  );
}
