/**
 * =====================================================================
 * NOTIFICATION ITEM - Từng dòng thông báo cụ thể
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC STYLING:
 * - `getTypeStyles`: Tự động thay đổi màu sắc và icon dựa trên loại thông báo (ORDER, PROMO, SYSTEM, v.v.).
 *
 * 2. INTERACTION:
 * - Khi click vào thông báo:
 *   a. Đánh dấu là đã đọc (`onRead`).
 *   b. Mở hộp thoại chi tiết (`Dialog`) để xem toàn bộ nội dung.
 *
 * 3. LOCALIZATION:
 * - Sử dụng `formatDistanceToNow` kết hợp với `locale` để hiển thị thời gian thân thiện (VD: "2 phút trước").
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Notification } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const locale = useLocale();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = () => {
    // Mark as read
    onRead(notification.id);
    // Show dialog
    setShowDialog(true);
  };

  const handleGoToLink = () => {
    setShowDialog(false);
    if (notification.link) {
      router.push(notification.link as any);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ORDER":
      case "ORDER_PLACED":
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
        return {
          bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
          icon: "bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400",
        };
      case "LOW_STOCK":
      case "ORDER_CANCELLED":
      case "ORDER_RETURNED":
        return {
          bg: "bg-amber-50/50 dark:bg-amber-900/10",
          icon: "bg-amber-500",
          text: "text-amber-600 dark:text-amber-400",
        };
      case "PROMO":
      case "PROMOTION":
        return {
          bg: "bg-primary/5 dark:bg-primary/10",
          icon: "bg-primary",
          text: "text-primary",
        };
      case "SYSTEM":
      case "INFO":
        return {
          bg: "bg-primary/5 dark:bg-primary/10",
          icon: "bg-primary",
          text: "text-primary",
        };
      default:
        return {
          bg: "bg-slate-50/50 dark:bg-slate-900/10",
          icon: "bg-slate-500",
          text: "text-slate-600 dark:text-slate-400",
        };
    }
  };

  const styles = getTypeStyles(notification.type);

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer flex-col gap-1 border-b px-4 py-3 transition-colors hover:bg-muted/50 last:border-0",
          !notification.isRead && styles.bg
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", styles.icon)}
              />
            )}
            <p
              className={cn(
                "text-sm font-medium",
                !notification.isRead && "font-bold"
              )}
            >
              {notification.title}
            </p>
          </div>
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              styles.text
            )}
          >
            {notification.type}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground pl-4">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: locale === "vi" ? vi : enUS,
          })}
        </p>
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span
                className={cn("h-3 w-3 rounded-full shrink-0", styles.icon)}
              />
              <DialogTitle>{notification.title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn("font-semibold", styles.text)}>
                {notification.type}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: locale === "vi" ? vi : enUS,
                })}
              </span>
            </div>
          </DialogHeader>
          <DialogDescription className="text-base leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </DialogDescription>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
            >
              Đóng
            </Button>
            {notification.link && (
              <Button onClick={handleGoToLink} className="flex-1 gap-2">
                <ExternalLink className="h-4 w-4" />
                Xem chi tiết
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
