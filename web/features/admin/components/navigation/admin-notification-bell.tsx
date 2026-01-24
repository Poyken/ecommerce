"use client";



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
  const [open, setOpen] = useState(false);

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

  // Derive ADMIN SPECIFIC notifications from the global store
  const displayNotifications = globalNotifications
    .filter((n) => ADMIN_RELEVANT_TYPES.includes(n.type?.toUpperCase() || ""))
    .slice(0, 50);

  // Calculate Admin specific unread count from the filtered list
  const adminUnreadCount = displayNotifications.filter((n) => !n.isRead).length;

  // Helper to extract Order ID from link
  const getOrderIdFromLink = (link?: string | null): string | null => {
    if (!link) return null;
    const match = link.match(/\/orders\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id); // Validates optimistic update in store implicitly
    // Navigation handled by Link wrapper or custom logic if needed
    setOpen(false);
  };

  const handleActionComplete = () => {
    // No need to fetch, socket or optimistic update handles it?
    // Ideally actions in AdminNotificationItem should update the store via an event or we just rely on socket push/revalidation
    // For now, we assume the action itself might trigger a socket event OR we might need to manually refresh the store if socket isn't sending updates for own actions
    // But since the request is to "not wait for click to load", relying on store is correct.
  };

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
              }}
            >
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[360px]">
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
                const isProcessed = oid ? processedOrderIds.has(oid) : false;
                return (
                  <Link
                    key={notification.id}
                    href={notification.link || "#"}
                    onClick={(e) => {
                      if (!notification.link) e.preventDefault();
                      handleNotificationClick(notification);
                    }}
                  >
                    <AdminNotificationItem
                      notification={notification}
                      onClick={() => {}} // Click handled by parent Link
                      onActionComplete={handleActionComplete}
                      isAlreadyProcessed={isProcessed}
                    />
                  </Link>
                );
              });
            })()}
          </div>
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
  );
}
