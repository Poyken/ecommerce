"use client";
import { OrderDetailsDialog } from "@/components/organisms/admin/order-details-dialog";
import { UpdateOrderStatusDialog } from "@/components/organisms/admin/update-order-status-dialog";
import { Checkbox } from "@/components/atoms/checkbox";
import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Order } from "@/types/models";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function OrdersClient({
  orders,
  total,
  page,
  limit,
}: {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}) {
  /**
   * =====================================================================
   * ADMIN ORDERS CLIENT - Quản lý đơn hàng
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. BULK ACTIONS (Thao tác hàng loạt):
   * - Sử dụng `Set` để lưu danh sách ID các dòng được chọn (hiệu năng O(1)).
   * - Toolbar chỉ hiện khi có ít nhất 1 dòng được chọn (`selectedRows.size > 0`).
   *
   * 2. CLIENT-SIDE EXPORT (CSV):
   * - Tạo file CSV trực tiếp từ dữ liệu JSON trên trình duyệt.
   * - Dùng `Blob` và `URL.createObjectURL` để tạo link download ảo.
   * - Không cần gọi API backend để export (tiết kiệm tài nguyên server).
   *
   * 3. STATUS COLORING:
   * - Logic render màu Badge dựa trên trạng thái đơn hàng (Completed=Green, Pending=Yellow...).
   * =====================================================================
   */
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const canRead = hasPermission("order:read");
  const canUpdate = hasPermission("order:update");
  const canDelete = hasPermission("order:delete");

  // Bulk Selection State
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Update URL when debounced search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/admin/orders?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/orders?${params.toString()}`);
  };

  const openStatusUpdate = (order: Order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === orders.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(orders.map((o) => o.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(t("confirmTitle"))) {
      // Implement bulk delete action here
      console.log("Deleting:", Array.from(selectedRows));
      setSelectedRows(new Set());
    }
  };

  const handleExport = () => {
    const ordersToExport = orders.filter((o) => selectedRows.has(o.id));
    if (ordersToExport.length === 0) return;

    // Define headers
    const headers = [
      t("orders.idLabel"),
      t("orders.emailLabel"),
      t("orders.totalLabel"),
      t("orders.statusLabel"),
      t("created"),
    ];

    // Map data
    const rows = ordersToExport.map((order) => [
      order.id,
      order.user?.email || t("unknownUser"),
      order.totalAmount,
      order.status,
      new Date(order.createdAt).toISOString(),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `orders_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 h-14">
        <div>
          <h1 className="text-3xl font-bold">{t("orders.management")}</h1>
        </div>
        {/* Bulk Actions Toolbar - Always rendered to prevent layout shift */}
        <div
          className={`flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg transition-all duration-200 ${
            selectedRows.size > 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <span className="text-sm font-medium text-primary">
            {t("orders.selectedCount", { count: selectedRows.size })}
          </span>
          <div className="h-4 w-px bg-primary/20 mx-2" />
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleBulkDelete}
            >
              <Trash2 size={16} className="mr-2" />
              {t("delete")}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 hover:bg-primary/10"
            onClick={handleExport}
          >
            <Download size={16} className="mr-2" />
            {t("orders.exportLabel")}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Input
          placeholder={t("orders.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("orders.title")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    orders.length > 0 && selectedRows.size === orders.length
                  }
                  onCheckedChange={toggleAll}
                  aria-label={t("selectAll")}
                />
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("orders.idLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("sidebar.users")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("orders.totalLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("orders.statusLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("created")}
              </TableHead>
              {(canRead || canUpdate) && (
                <TableHead className="text-right text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canRead || canUpdate ? 7 : 6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("orders.noFound")}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(order.id)}
                      onCheckedChange={() => toggleRow(order.id)}
                      aria-label={t("selectItem", { item: order.id })}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {order.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.user?.email || t("unknownUser")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(Number(order.totalAmount))}
                  </TableCell>
                  <TableCell>
<StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  {(canRead || canUpdate) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetails(order)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                          >
                            {t("orders.details")}
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStatusUpdate(order)}
                            disabled={
                              order.status === "DELIVERED" ||
                              order.status === "CANCELLED"
                            }
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("edit")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div className="text-sm text-muted-foreground">
            {t("showing", {
              count: `${total === 0 ? 0 : (page - 1) * limit + 1} - ${Math.min(
                page * limit,
                total
              )}`,
              total: total,
              item: t("orders.title").toLowerCase(),
            })}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={!hasPrevPage}
              className="border-white/10 hover:bg-white/5"
            >
              {t("pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={!hasNextPage}
              className="border-white/10 hover:bg-white/5"
            >
              {t("pagination.next")}
            </Button>
          </div>
        </div>
      </GlassCard>

      {selectedOrder && (
        <>
          <UpdateOrderStatusDialog
            key={selectedOrder.id}
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            orderId={selectedOrder.id}
            currentStatus={
              orders.find((o) => o.id === selectedOrder.id)?.status ||
              selectedOrder.status
            }
          />
          <OrderDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            orderId={selectedOrder.id}
          />
        </>
      )}
    </div>
  );
}
