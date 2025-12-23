/**
 * =====================================================================
 * NOTIFICATION BELL - Biểu tượng chuông thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-TIME UPDATES:
 * - Kết nối với `NotificationContext` để lấy danh sách thông báo mới nhất.
 * - Hiển thị số lượng thông báo chưa đọc (`unreadCount`) trên biểu tượng chuông.
 *
 * 2. POPOVER UI:
 * - Khi click vào chuông, một danh sách rút gọn các thông báo gần đây sẽ hiện ra.
 * - Hỗ trợ "Đánh dấu tất cả là đã đọc" (`markAllAsRead`).
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { useNotifications } from "@/contexts/notification-context";
import { Link } from "@/i18n/routing";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } =
    useNotifications();
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Fetch latest notifications when opening the dropdown
      refetch();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">{t("title")}</h4>
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
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-20" />
              <p className="text-sm">{t("noNotifications")}</p>
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t p-2 text-center">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full text-xs">
                {t("viewAllNotifications")}
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
