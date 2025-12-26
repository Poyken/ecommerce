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
import { Link } from "@/i18n/routing";
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
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      refetch();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
    setDialogOpen(true);
    setOpen(false);
  };

  const handleActionComplete = () => {
    refetch();
  };

  // Parse order info from notification
  const getOrderInfo = (notification: Notification | null) => {
    if (!notification) return null;

    const orderId = notification.link?.match(/\/orders\/([a-zA-Z0-9-]+)/)?.[1];
    // Try to extract amount from message (e.g., "2.500.000đ" or "$2,500")
    const amountMatch = notification.message?.match(
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*đ?/
    );

    return {
      orderId: orderId || "N/A",
      shortId: orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "N/A",
    };
  };

  const orderInfo = getOrderInfo(selectedNotification);

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <button className="transition-all hover:text-primary text-foreground/70 relative w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full group">
            <Bell
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">{t("title")}</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
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
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.slice(0, 8).map((notification) => (
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
          {notifications.length > 0 && (
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

      {/* Order Detail Dialog */}
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
              <Link href={selectedNotification.link as any}>
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
