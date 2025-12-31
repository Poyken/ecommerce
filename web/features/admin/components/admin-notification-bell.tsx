"use client";

/**
 * =====================================================================
 * ADMIN NOTIFICATION BELL - Chuông thông báo cho trang Admin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KHÁC BIỆT VỚI USER BELL:
 * - Sử dụng AdminNotificationItem với quick actions (Accept/Reject).
 * - Tối ưu cho workflow xử lý đơn hàng của Admin.
 *
 * 2. ORDER DETAIL DIALOG:
 * - Khi click vào notification, mở dialog chi tiết đơn hàng.
 * - Admin có thể xem thông tin và xử lý ngay tại dialog.
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { Link, useRouter } from "@/i18n/routing";
import { type Notification } from "@/types/models";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { Bell, ExternalLink, Package, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AdminNotificationItem } from "./admin-notification-item";

export function AdminNotificationBell() {
  const {
    notifications: globalNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const t = useTranslations("notifications");
  const tAdmin = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Local state for Admin Notifications (independent of user store, but synced)
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Admin relevant types defined for both count and filtering
  const ADMIN_RELEVANT_TYPES = [
    "ADMIN_NEW_ORDER",
    "ADMIN_ORDER_ACCEPTED",
    "ADMIN_ORDER_PROCESSING",
    "ADMIN_ORDER_SHIPPED",
    "ADMIN_ORDER_DELIVERED",
    "ADMIN_ORDER_CANCELLED",
    "LOW_STOCK",
    "STOCK_ALERT",
    "REVIEW_CREATED",
    "SYSTEM_ALERT",
    "ORDER_RETURNED",
  ];

  // REAL-TIME: Combine local fetched notifications with global real-time notifications
  // to ensure the latest ones are always visible and count is accurate.
  const displayNotifications = (() => {
    const combined = [...adminNotifications];
    // Add real-time notifications from store that aren't already in local state
    globalNotifications.forEach((gn) => {
      if (
        ADMIN_RELEVANT_TYPES.includes(gn.type?.toUpperCase() || "") &&
        !combined.some((cn) => cn.id === gn.id)
      ) {
        combined.unshift(gn);
      }
    });
    return combined
      .filter((n) => ADMIN_RELEVANT_TYPES.includes(n.type?.toUpperCase() || ""))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 50); // limit to reasonable amount
  })();

  const adminUnreadCount = displayNotifications.filter((n) => !n.isRead).length;

  // Helper to extract Order ID from link
  const getOrderIdFromLink = (link?: string | null): string | null => {
    if (!link) return null;
    const match = link.match(/\/orders\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  // Fetch admin notifications when popover opens
  const fetchAdminNotifications = async () => {
    setIsLoading(true);
    try {
      const { getAdminNotificationsAction } = await import(
        "@/features/notifications/actions"
      );
      const res = await getAdminNotificationsAction(1, 30); // Get top 30
      if (res && "data" in res && Array.isArray(res.data)) {
        setAdminNotifications(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchAdminNotifications();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    // Update local state if it's there
    setAdminNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    if (
      (notification.type?.includes("ORDER") ||
        notification.link?.includes("/orders/")) &&
      notification.link
    ) {
      const orderId = notification.link.match(/\/orders\/([a-zA-Z0-9-]+)/)?.[1];
      if (orderId) {
        router.push(`/admin/orders?orderId=${orderId}`);
      } else {
        router.push(notification.link);
      }
    } else if (notification.link) {
      router.push(notification.link);
    }

    setOpen(false);
  };

  const handleActionComplete = () => {
    fetchAdminNotifications();
  };

  // Parse order info from notification for Dialog details (fallback)
  const getOrderInfo = (notification: Notification | null) => {
    if (!notification) return null;

    const orderId = notification.link?.match(/\/orders\/([a-zA-Z0-9-]+)/)?.[1];

    return {
      orderId: orderId || "N/A",
      shortId: orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "N/A",
    };
  };

  const orderInfo = getOrderInfo(selectedNotification);

  // Compute processed orders Set
  const processedOrderIds = new Set<string>();
  displayNotifications.forEach((n) => {
    const type = n.type?.toUpperCase() || "";
    if (
      type === "ORDER_PROCESSING" ||
      type === "ORDER_SHIPPED" ||
      type === "ORDER_DELIVERED" ||
      type === "ORDER_CANCELLED" ||
      type === "ORDER_RETURNED"
    ) {
      const oid = getOrderIdFromLink(n.link);
      if (oid) processedOrderIds.add(oid);
    }
  });

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            {adminUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background z-50 shadow-sm">
                {adminUnreadCount > 99 ? "99+" : adminUnreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{t("title")}</h4>
              {adminUnreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
                  {adminUnreadCount} new
                </span>
              )}
            </div>
            {displayNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={async () => {
                  // Mark all as read in the store/server
                  await markAllAsRead();
                  // For the admin bell specifically, re-fetch immediately since it uses local state
                  await fetchAdminNotifications();
                }}
              >
                {t("markAllRead")}
              </Button>
            )}
          </div>

          {/* Notification List */}
          <ScrollArea className="h-[360px]">
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <span className="loading loading-spinner loading-md opacity-50">
                  Loading...
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                {(() => {
                  if (displayNotifications.length === 0) {
                    return (
                      <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                        <div className="p-4 rounded-full bg-muted/50">
                          <Bell className="h-8 w-8 opacity-30" />
                        </div>
                        <p className="text-sm">{t("noNotifications")}</p>
                      </div>
                    );
                  }

                  return displayNotifications.map((notification) => {
                    const oid = getOrderIdFromLink(notification.link);
                    const isProcessed = oid
                      ? processedOrderIds.has(oid)
                      : false;
                    return (
                      <AdminNotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                        onActionComplete={handleActionComplete}
                        isAlreadyProcessed={isProcessed}
                      />
                    );
                  });
                })()}
              </div>
            )}
          </ScrollArea>

          {/* Footer - View All */}
          <div className="border-t p-2 bg-muted/20">
            <Link href="/admin/notifications" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs hover:bg-primary/10 hover:text-primary"
              >
                {t("viewAllNotifications")}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Order Detail Dialog - Fallback */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {selectedNotification?.title || "Chi tiết thông báo"}
            </DialogTitle>
            <DialogDescription>
              {orderInfo?.shortId && orderInfo.shortId !== "N/A" && (
                <span className="font-mono text-primary">
                  Mã đơn: {orderInfo.shortId}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Notification Content */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm">{selectedNotification?.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedNotification &&
                  formatDistanceToNow(
                    new Date(selectedNotification.createdAt),
                    {
                      addSuffix: true,
                      locale: locale === "vi" ? vi : enUS,
                    }
                  )}
              </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Package className="h-3 w-3" />
                  <span>Loại</span>
                </div>
                <p className="font-medium text-sm">
                  {selectedNotification?.type || "SYSTEM"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>Trạng thái</span>
                </div>
                <p className="font-medium text-sm">
                  {selectedNotification?.isRead ? (
                    <span className="text-muted-foreground">Đã đọc</span>
                  ) : (
                    <span className="text-primary">Chưa đọc</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tAdmin("close")}
            </Button>
            {selectedNotification?.link && (
              <Link href={selectedNotification.link}>
                <Button onClick={() => setDialogOpen(false)}>
                  {tAdmin("orders.details")}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
