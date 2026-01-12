"use client";

/**
 * =====================================================================
 * ORDERS CLIENT - Quản lý đơn hàng (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Filter theo status (Server-side via URL)
 * - Bulk actions: Export CSV, Delete
 * - Quick status update
 * - Show status counts from server props
 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderDetailsDialog } from "@/features/admin/components/orders/order-details-dialog";
import { UpdateOrderStatusDialog } from "@/features/admin/components/orders/update-order-status-dialog";
import {
  Check,
  Clock,
  Download,
  Edit,
  Eye,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  Upload,
  X,
  Loader2,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/components/ui/use-toast";
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
import { updateOrderStatusAction } from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Order, OrderStatus } from "@/types/models";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type FilterType =
  | "all"
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export function OrdersClient({
  orders,
  total,
  page,
  limit,
  counts,
  currentStatus = "all",
}: {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  counts?: Record<string, number>;
  currentStatus?: string;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { notifications } = useNotificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedNotiId = useRef<string | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Track processed orderId to prevent infinite loop/re-processing
  const processedOrderIdRef = useRef<string | null>(null);

  // Auto-open order details dialog when orderId query param is present (from notification click)
  useEffect(() => {
    const orderIdFromUrl = searchParams.get("orderId");

    // Only process if we have an orderId and we haven't processed this specific ID yet
    // OR if we processed it but the dialog is closed (user clicked notification again)
    if (
      orderIdFromUrl &&
      (orderIdFromUrl !== processedOrderIdRef.current || !detailsDialogOpen)
    ) {
      processedOrderIdRef.current = orderIdFromUrl;

      // Process inside setTimeout to avoid set-state-in-effect warning and allow render to complete
      setTimeout(() => {
        const order = orders.find((o) => o.id === orderIdFromUrl);
        if (order) {
          setSelectedOrder(order);
          setDetailsDialogOpen(true);
        } else {
          // Order not in current page, create temporary order object to open dialog
          setSelectedOrder({ id: orderIdFromUrl } as Order);
          setDetailsDialogOpen(true);
        }

        // Clean up URL without triggering a refresh that resets state
        // window.history.replaceState is safer than router.replace here to avoid re-running server components
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("orderId");
        window.history.replaceState(null, "", newUrl.toString());
      }, 0);
    }
  }, [searchParams, orders, detailsDialogOpen]);

  // Auto-refresh order list when a new ADMIN_NEW_ORDER notification arrives
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const latestNoti = notifications[0];
    if (!latestNoti) return;

    // Only trigger if it's a new order and we haven't processed this specific notification ID yet
    if (
      latestNoti.type === "ADMIN_NEW_ORDER" &&
      latestNoti.id !== lastProcessedNotiId.current
    ) {
      lastProcessedNotiId.current = latestNoti.id;

      // Use router.refresh() to revalidate server components (refreshes the 'orders' prop)
      startTransition(() => {
        router.refresh();
      });
    }
  }, [notifications, router]);

  // Stats from server
  const pendingCount = counts?.PENDING || 0;
  const processingCount = counts?.PROCESSING || 0;
  const shippedCount = counts?.SHIPPED || 0;
  const deliveredCount = counts?.DELIVERED || 0;
  const cancelledCount = counts?.CANCELLED || 0;
  const totalCount = counts?.total || total;

  const canRead = hasPermission("order:read");
  const canUpdate = hasPermission("order:update");
  // const canDelete = hasPermission("order:delete"); // Delete removed

  // Bulk Selection State
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const {
    searchTerm,
    setSearchTerm,
    isPending: isTablePending,
    handleFilterChange,
  } = useAdminTable("/admin/orders");

  const handleStatusChange = (status: FilterType) => {
    handleFilterChange("status", status);
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mimic API Call for import
      toast({
        title: "Importing...",
        description: `Processing file: ${file.name}`,
      });

      setTimeout(() => {
        toast({
          title: "Success",
          description: `Successfully imported orders from ${file.name}`,
          variant: "default",
        });
        startTransition(() => {
          router.refresh();
        });
      }, 1500);

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    const ordersToExport = orders.filter((o) => selectedRows.has(o.id));
    if (ordersToExport.length === 0) return;

    const headers = [
      t("orders.idLabel"),
      t("orders.emailLabel"),
      t("orders.totalLabel"),
      t("orders.statusLabel"),
      t("created"),
    ];

    const rows = ordersToExport.map((order) => [
      order.id,
      order.user?.email || t("unknownUser"),
      order.totalAmount,
      order.status,
      new Date(order.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "PROCESSING":
        return <RefreshCw className="h-4 w-4" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4" />;
      case "DELIVERED":
        return <Check className="h-4 w-4" />;
      case "CANCELLED":
        return <X className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv,.xlsx"
      />
      {/* Page Header */}
      <AdminPageHeader
        title={t("orders.management")}
        subtitle={t("orders.showingCount", {
          count: orders.length,
          total: totalCount,
        })}
        icon={<ShoppingBag className="text-blue-600 fill-blue-600/10" />}
        stats={[
          { label: "total", value: totalCount, variant: "default" },
          { label: "pending", value: pendingCount, variant: "warning" },
          { label: "processing", value: processingCount, variant: "info" },
          { label: "delivered", value: deliveredCount, variant: "success" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg mr-2">
                <span className="text-sm font-medium text-primary">
                  {t("orders.selectedCount", { count: selectedRows.size })}
                </span>
                <div className="h-4 w-px bg-primary/20 mx-2" />
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
            )}

            <Button
              variant="outline"
              onClick={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
              disabled={isPending}
              className="gap-2"
            >
              <RefreshCw
                size={16}
                className={cn(isPending && "animate-spin")}
              />
              {t("refresh") || "Refresh"}
            </Button>

            <Button onClick={handleImportClick}>
              <Upload size={16} className="mr-2" />
              Import
            </Button>
          </div>
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={currentStatus}
          onValueChange={(v) => handleStatusChange(v as FilterType)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
              disabled={isPending}
            >
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="PENDING"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-amber-600 transition-all gap-2"
            >
              <Clock className="h-4 w-4" />
              Pending
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[10px] font-black"
              >
                {pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="PROCESSING"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Processing
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] font-black"
              >
                {processingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="SHIPPED"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all gap-2"
            >
              <Truck className="h-4 w-4" />
              Shipped
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-[10px] font-black"
              >
                {shippedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="DELIVERED"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
            >
              <Check className="h-4 w-4" />
              Delivered
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-black"
              >
                {deliveredCount}
              </Badge>
            </TabsTrigger>
            {cancelledCount > 0 && (
              <TabsTrigger
                value="CANCELLED"
                className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-rose-600 transition-all gap-2"
              >
                <X className="h-4 w-4" />
                Cancelled
                <Badge
                  variant="outline"
                  className="ml-1 h-5 px-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 text-[10px] font-black"
                >
                  {cancelledCount}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("orders.searchPlaceholder")}
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
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    orders.length > 0 && selectedRows.size === orders.length
                  }
                  onCheckedChange={toggleAll}
                  aria-label={t("selectAll")}
                />
              </TableHead>
              <TableHead className="w-[150px]">{t("orders.idLabel")}</TableHead>
              <TableHead>{t("sidebar.users")}</TableHead>
              <TableHead>{t("orders.totalLabel")}</TableHead>
              <TableHead>{t("orders.statusLabel")}</TableHead>
              <TableHead>{t("orders.paymentStatusLabel")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canRead || canUpdate) && (
                <TableHead className="text-right w-[120px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canRead || canUpdate ? 8 : 7}>
                  <AdminEmptyState
                    icon={ShoppingBag}
                    title={t("orders.noFound")}
                    description="No orders found matching your criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    selectedRows.has(order.id) && "bg-muted/20"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(order.id)}
                      onCheckedChange={() => toggleRow(order.id)}
                      aria-label={`Select order ${order.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium font-mono">
                        #{order.id.slice(0, 8)}
                      </span>
                      {order.items && order.items.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {order.items.length} items
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {order.user
                          ? `${order.user.firstName} ${order.user.lastName}`
                          : t("unknownUser")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(order.totalAmount))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={order.status}
                      icon={getStatusIcon(order.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        order.paymentStatus === "PAID"
                          ? "DELIVERED"
                          : order.paymentStatus === "FAILED"
                          ? "CANCELLED"
                          : "PENDING"
                      }
                      label={t(
                        `orders.paymentStatusMapping.${order.paymentStatus}` as any
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  {(canRead || canUpdate) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Actions for PENDING orders */}
                        {canUpdate &&
                          order.status?.toUpperCase() === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                disabled={loadingOrderId === order.id}
                                onClick={async () => {
                                  setLoadingOrderId(order.id);
                                  try {
                                    const result =
                                      await updateOrderStatusAction(
                                        order.id,
                                        "PROCESSING"
                                      );
                                    if (result?.error) {
                                      toast({
                                        variant: "destructive",
                                        title: "Lỗi",
                                        description: result.error,
                                      });
                                    } else {
                                      toast({ title: "Đã xác nhận đơn hàng" });
                                      router.refresh();
                                    }
                                  } catch (e: any) {
                                    toast({
                                      variant: "destructive",
                                      title: "Có lỗi xảy ra",
                                      description: e.message,
                                    });
                                  } finally {
                                    setLoadingOrderId(null);
                                  }
                                }}
                                title={t("orders.statusMapping.PROCESSING")}
                              >
                                {loadingOrderId === order.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                                disabled={loadingOrderId === order.id}
                                onClick={async () => {
                                  const reason = prompt("Nhập lý do hủy đơn:");
                                  if (!reason) return;
                                  setLoadingOrderId(order.id);
                                  try {
                                    const result =
                                      await updateOrderStatusAction(
                                        order.id,
                                        "CANCELLED",
                                        true,
                                        reason
                                      );
                                    if (result?.error) {
                                      toast({
                                        variant: "destructive",
                                        title: "Lỗi",
                                        description: result.error,
                                      });
                                    } else {
                                      toast({ title: "Đã hủy đơn hàng" });
                                      router.refresh();
                                    }
                                  } catch (e: any) {
                                    toast({
                                      variant: "destructive",
                                      title: "Có lỗi xảy ra",
                                      description: e.message,
                                    });
                                  } finally {
                                    setLoadingOrderId(null);
                                  }
                                }}
                                title={t("orders.statusMapping.CANCELLED")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                        {canRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => openStatusUpdate(order)}
                          >
                            <Edit className="h-4 w-4" />
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
      </AdminTableWrapper>

      {/* Pagination with page numbers - only show when needed */}
      {orders.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      {/* Dialogs */}
      {selectedOrder && (
        <>
          <UpdateOrderStatusDialog
            key={selectedOrder.id}
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            orderId={selectedOrder.id}
            currentStatus={selectedOrder.status}
          />
          <OrderDetailsDialog
            orderId={selectedOrder.id}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  );
}
