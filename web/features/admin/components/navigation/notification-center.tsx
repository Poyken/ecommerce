"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Check,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface Notification {
  id: string;
  type: "NEW_ORDER" | "LOW_STOCK" | "REVIEW" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClear?: (id: string) => void;
}

/**
 * =====================================================================
 * NOTIFICATION CENTER - Trung tâm thông báo Admin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NOTIFICATION TYPES:
 * - NEW_ORDER: Có đơn hàng mới cần xử lý.
 * - LOW_STOCK: Sản phẩm sắp hết hàng (< 5 món).
 * - REVIEW: Có đánh giá mới từ khách hàng.
 * - SYSTEM: Thông báo hệ thống (cập nhật, bảo trì).
 *
 * 2. UNREAD BADGE:
 * - Hiển thị số lượng thông báo chưa đọc bằng badge đỏ.
 *
 * 3. QUICK ACTIONS:
 * - Mark as Read: Đánh dấu đã đọc từng thông báo.
 * - Mark All Read: Đánh dấu tất cả đã đọc.
 * - Navigate: Click vào thông báo để đi đến trang liên quan.
 * =====================================================================
 */

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationCenterProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "NEW_ORDER":
        return <ShoppingCart className="h-4 w-4 text-primary" />;
      case "LOW_STOCK":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "REVIEW":
        return <Package className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link as any);
    }
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    setOpen(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tCommon("justNow");
    if (diffMins < 60) return tCommon("mAgo", { count: diffMins });
    if (diffHours < 24) return tCommon("hAgo", { count: diffHours });
    return tCommon("dAgo", { count: diffDays });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("notifications")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications")}</span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
              onClick={() => onMarkAllRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              {t("markAllRead")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup className="max-h-[400px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.isRead && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm truncate",
                      !notification.isRead && "font-medium"
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="h-2 w-2 bg-primary rounded-full shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm text-primary"
              onClick={() => {
                router.push("/admin/notifications" as any);
                setOpen(false);
              }}
            >
              {t("viewAllNotifications")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
