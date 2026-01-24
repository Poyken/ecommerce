

"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { Link } from "@/i18n/routing";
import { Notification } from "@/types/models";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  const { notifications, markAsRead, markAllAsRead, refresh } =
    useNotificationStore();
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Define Admin-specific notification types that should NOT show in User Bell
  const ADMIN_TYPES = [
    "ADMIN_NEW_ORDER",
    "LOW_STOCK",
    "REVIEW_CREATED",
    "STOCK_ALERT",
    "SYSTEM_ALERT",
    "ORDER_RETURNED",
  ];

  // Filter out admin-specific notifications for the user bell
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const userNotifications = safeNotifications.filter((n) => {
    const type = n.type?.toUpperCase() || "";
    return !ADMIN_TYPES.includes(type);
  });

  // Calculate unread count specifically for user notifications
  const userUnreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Fetch latest notifications when opening the dropdown
      refresh();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.link) {
      router.push(notification.link as any);
    } else {
      router.push("/notifications");
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
          {userUnreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {userUnreadCount > 99 ? "99+" : userUnreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">{t("title")}</h4>
          {userNotifications.length > 0 && (
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
          {userNotifications.length > 0 ? (
            <div className="flex flex-col">
              {userNotifications.map((notification) => (
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
        {userNotifications.length > 0 && (
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
