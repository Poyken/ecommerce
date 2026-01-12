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
 * - Sử dụng `formatDistanceToNow` kết hợp với `locale` để hiển thị thời gian thân thiện (VD: "2 phút trước"). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { cn } from "@/lib/utils";
import { Notification } from "@/types/models";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useLocale } from "next-intl";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const locale = useLocale();

  const getTypeStyles = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ORDER":
      case "ORDER_PLACED":
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
      case "ADMIN_NEW_ORDER":
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
    <div
      onClick={() => onClick(notification)}
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
  );
}
