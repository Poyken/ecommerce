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
import {
  Notification,
  useNotifications,
} from "@/contexts/notification-context";
import { Link, useRouter } from "@/i18n/routing";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { Bell, ExternalLink, Package, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AdminNotificationItem } from "./admin-notification-item";

export function AdminNotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } =
    useNotifications();
  const t = useTranslations("notifications");
  const tAdmin = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter notifications relevant to Admin
  // Only show notifications related to admin workflow: Orders, Stock, Reviews
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const adminNotifications = safeNotifications.filter((n) => {
    const type = n.type?.toUpperCase() || "";
    return ["ORDER_PLACED", "ORDER_CANCELLED", "LOW_STOCK", "REVIEW"].some(
      (t) => type.includes(t)
    );
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      refetch();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    // If it's an order notification, go to admin orders page with orderId to open dialog
    if (
      (notification.type?.includes("ORDER") ||
        notification.link?.includes("/orders/")) &&
      notification.link
    ) {
      const orderId = notification.link.match(/\/orders\/([a-zA-Z0-9-]+)/)?.[1];
      if (orderId) {
        // Redirect to admin orders page with orderId query param to auto-open dialog
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
    refetch();
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

  // Calculate admin-specific unread count based on loaded notifications
  // This ensures the badge matches the visual list, resolving "User vs Admin notification" confusion
  const adminUnreadCount = adminNotifications.filter((n) => !n.isRead).length;

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
            {adminUnreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => markAllAsRead()}
              >
                {t("markAllRead")}
              </Button>
            )}
          </div>

          {/* Notification List */}
          <ScrollArea className="h-[360px]">
            {adminNotifications.length > 0 ? (
              <div className="flex flex-col">
                {adminNotifications.slice(0, 10).map((notification) => (
                  <AdminNotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                    onActionComplete={handleActionComplete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50">
                  <Bell className="h-8 w-8 opacity-30" />
                </div>
                <p className="text-sm">{t("noNotifications")}</p>
              </div>
            )}
          </ScrollArea>

          {/* Footer - View All */}
          {safeNotifications.length > 0 && (
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
          )}
        </PopoverContent>
      </Popover>

      {/* Order Detail Dialog - Fallback used by AdminNotificationItem actions if needed, 
          but primarily we redirect to admin/orders page */}
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
