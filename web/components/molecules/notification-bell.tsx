/**
 * =====================================================================
 * NOTIFICATION BELL - Biểu tượng chuông thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTEXT INTEGRATION:
 * - Component này không tự quản lý Socket. Nó chỉ "tiêu thụ" (consume) dữ liệu từ `NotificationContext`.
 * - Tách biệt UI (Bell) và Logic (Socket/State) giúp code sạch và dễ bảo trì.
 *
 * 2. POPOVER INTERACTION (Hành vi Dropdown):
 * - Khi mở (`onOpenChange`), ta gọi `refetch()` để đảm bảo user thấy danh sách mới nhất (đôi khi Socket có thể miss nếu mạng lag).
 * - `markAsRead` được gọi khi user click vào 1 thông báo cụ thể -> UX: Giảm notification badge ngay lập tức.
 *
 * 3. BADGE LOGIC:
 * - Chỉ hiện badge đỏ nếu `unreadCount > 0`.
 * - Nếu > 99 thì hiện "99+" để tránh vỡ layout nếu user có quá nhiều thông báo.
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } =
    useNotifications();
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Fetch latest notifications when opening the dropdown
      refetch();
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <button className="transition-all hover:text-primary text-foreground/70 relative w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full group">
          <Bell
            size={22}
            className="group-hover:scale-110 transition-transform"
          />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </button>
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
                  onClick={handleNotificationClick}
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
