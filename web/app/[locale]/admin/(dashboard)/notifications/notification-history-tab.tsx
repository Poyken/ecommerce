"use client";

/**
 * =====================================================================
 * NOTIFICATION HISTORY TAB - Lịch sử thông báo với Quick Actions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TABS FILTER:
 * - Tất cả / Đơn hàng / Hệ thống để lọc nhanh.
 *
 * 2. QUICK ACTIONS:
 * - Accept/Reject đơn hàng trực tiếp từ bảng.
 * - Chỉ hiển thị với notification loại ORDER chưa xử lý.
 *
 * 3. BULK ACTIONS:
 * - Đánh dấu tất cả đã đọc. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
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
import { AdminTableWrapper } from "@/features/admin/components/ui/admin-page-components";
import {
  getAdminNotificationsAction,
  markAllAsReadAction,
} from "@/features/notifications/actions";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Notification } from "@/types/models";
import { format } from "date-fns";
import {
  Bell,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type FilterType = "all" | "order" | "system";

export function NotificationHistoryTab() {
  const t = useTranslations("admin.notifications");
  const tAdmin = useTranslations("admin");
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    let typeFilter: string | undefined = undefined;

    if (filter === "order") {
      // Include ALL order-related statuses so they show up in filter
      const types = [
        "ORDER",
        "ORDER_PLACED",
        "ADMIN_NEW_ORDER",
        "ORDER_PROCESSING",
        "ORDER_SHIPPED",
        "ORDER_DELIVERED",
        "ORDER_CANCELLED",
        "ORDER_RETURNED",
      ];
      typeFilter = types.join(",");
    } else if (filter === "system") {
      const types = ["SYSTEM", "LOW_STOCK", "REVIEW", "PROMO"];
      typeFilter = types.join(",");
    }

    const res = await getAdminNotificationsAction(
      page,
      15,
      undefined,
      typeFilter
    );
    if (res && "data" in res && res.data) {
      setNotifications(res.data);
      if (res.meta) {
        setTotalPages(res.meta.lastPage);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  // Filter by search
  const filteredNotifications = notifications.filter((n) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(searchLower) ||
      n.message.toLowerCase().includes(searchLower)
    );
  });

  // Get order ID from notification link
  const getOrderId = (link?: string | null): string | null => {
    if (!link) return null;
    const match = link.match(/\/orders\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  // Compute processed orders
  const processedOrderIds = new Set<string>();
  notifications.forEach((n) => {
    const type = n.type?.toUpperCase() || "";
    if (
      type === "ORDER_PROCESSING" ||
      type === "ORDER_SHIPPED" ||
      type === "ORDER_DELIVERED" ||
      type === "ORDER_CANCELLED" ||
      type === "ORDER_RETURNED"
    ) {
      const oid = getOrderId(n.link);
      if (oid) processedOrderIds.add(oid);
    }
  });

  const handleAccept = async (notification: Notification) => {
    const orderId = getOrderId(notification.link);
    if (!orderId) return;

    setActionLoading(notification.id);
    try {
      const result = await updateOrderStatusAction(orderId, "PROCESSING");
      if (result.success) {
        toast({
          title: tAdmin("success"),
          description: tAdmin("orders.successUpdateStatus"),
        });
        fetchNotifications();
      } else {
        toast({
          title: tAdmin("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (notification: Notification) => {
    const orderId = getOrderId(notification.link);
    if (!orderId) return;

    setActionLoading(notification.id);
    try {
      const result = await updateOrderStatusAction(orderId, "CANCELLED");
      if (result.success) {
        toast({
          title: tAdmin("success"),
          description: tAdmin("orders.successUpdateStatus"),
        });
        fetchNotifications();
      } else {
        toast({
          title: tAdmin("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllAsReadAction();
    if (result.success) {
      toast({ title: tAdmin("success") });
      fetchNotifications();
    }
  };

  // Check if this is a NEW order notification that can be acted upon
  const isNewOrderNotification = (notif: Notification) => {
    const type = notif.type?.toUpperCase() || "";
    // Only ORDER or ORDER_PLACED = new order needing action
    // Exclude status updates like ORDER_PROCESSING, ORDER_CANCELLED, etc.
    return (
      type === "ORDER" ||
      type === "ORDER_PLACED" ||
      type === "ADMIN_NEW_ORDER" ||
      notif.title?.toLowerCase().includes("đơn hàng mới") ||
      notif.title?.toLowerCase().includes("new order")
    );
  };

  // Check if notification is about an already processed order
  const isAlreadyProcessedType = (notif: Notification) => {
    return [
      "ORDER_PROCESSING",
      "ORDER_SHIPPED",
      "ORDER_DELIVERED",
      "ORDER_CANCELLED",
      "ORDER_RETURNED",
    ].includes(notif.type?.toUpperCase() || "");
  };

  const getTypeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ORDER":
      case "ORDER_PLACED":
      case "ADMIN_NEW_ORDER":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "ORDER_CANCELLED":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "PROMO":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  // Stats
  const orderCount = notifications.filter(isNewOrderNotification).length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <GlassCard className="p-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("history")}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-muted">
              {notifications.length} total
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="order" className="gap-2">
              <Package className="h-4 w-4" />
              Orders ({orderCount})
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              System
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={loading}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40%]">{t("form.title")}</TableHead>
              <TableHead>{t("form.type")}</TableHead>
              <TableHead>{t("createdAt")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Bell className="h-8 w-8 text-muted-foreground/30" />
                    <span className="text-sm text-muted-foreground">
                      {t("noHistory")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((notif) => {
                const orderId = getOrderId(notif.link);
                const isProcessed = orderId
                  ? processedOrderIds.has(orderId)
                  : false;

                // Only show actions for NEW orders, not status updates
                // And ONLY if we haven't seen a "Processing" status update for this order in the list
                const canTakeAction =
                  isNewOrderNotification(notif) &&
                  orderId &&
                  !notif.isRead &&
                  !isAlreadyProcessedType(notif) &&
                  !isProcessed;

                return (
                  <TableRow
                    key={notif.id}
                    className={cn(
                      "transition-colors",
                      !notif.isRead && "bg-primary/5"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {!notif.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                        )}
                        <div className="space-y-1">
                          <p
                            className={cn(
                              "font-medium",
                              !notif.isRead && "font-bold"
                            )}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                          getTypeStyle(notif.type)
                        )}
                      >
                        {notif.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(notif.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {notif.isRead ? (
                        <div className="flex items-center text-emerald-500 gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Read</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-500 gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">Unread</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {canTakeAction ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleAccept(notif)}
                              disabled={actionLoading === notif.id}
                            >
                              {actionLoading === notif.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(notif)}
                              disabled={actionLoading === notif.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                        {notif.link && (
                          <Link href={notif.link as any}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
