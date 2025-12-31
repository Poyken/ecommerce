"use client";

/**
 * =====================================================================
 * ADMIN NOTIFICATION ITEM - Item thông báo cho Admin với Quick Actions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUICK ACTIONS:
 * - Cho phép Admin Accept/Reject đơn hàng trực tiếp từ notification popover.
 * - Chỉ hiển thị actions khi notification liên quan đến đơn hàng PENDING.
 *
 * 2. ORDER DETECTION:
 * - Parse link để lấy orderId nếu notification có link đến /orders/[id].
 * - Nếu type là ORDER và status là PENDING thì hiển thị quick actions.
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/features/admin/actions";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { cn } from "@/lib/utils";
import { type Notification } from "@/types/models";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { Check, Eye, Package, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface AdminNotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onActionComplete?: () => void;
  isAlreadyProcessed?: boolean;
}

export function AdminNotificationItem({
  notification,
  onClick,
  onActionComplete,
  isAlreadyProcessed = false,
}: AdminNotificationItemProps) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const { markAsRead } = useNotificationStore();
  const [isLoading, setIsLoading] = useState<"accept" | "reject" | null>(null);
  const [hasActionTaken, setHasActionTaken] = useState(false);

  // Parse order ID from notification link (e.g., /orders/abc123)
  const getOrderIdFromLink = (link?: string | null): string | null => {
    if (!link) return null;
    const match = link.match(/\/orders\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  const orderId = getOrderIdFromLink(notification.link);

  // Only show quick actions for NEW order notifications (ORDER or ORDER_PLACED type)
  // NOT for status update notifications like ORDER_CANCELLED, ORDER_PROCESSING, etc.
  const isNewOrderNotification =
    notification.type?.toUpperCase() === "ORDER" ||
    notification.type?.toUpperCase() === "ORDER_PLACED" ||
    notification.type?.toUpperCase() === "ADMIN_NEW_ORDER" ||
    notification.title?.toLowerCase().includes("đơn hàng mới") ||
    notification.title?.toLowerCase().includes("new order");

  // Exclude already processed notifications by type
  const isAlreadyProcessedType = [
    "ORDER_PROCESSING",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED",
    "ORDER_RETURNED",
  ].includes(notification.type?.toUpperCase() || "");

  // Check if this is a pending order that can be acted upon
  // Also hide if action taken locally or if it's a status update notification
  // OR if we know from parent that this order is processed
  const canTakeAction =
    isNewOrderNotification &&
    orderId &&
    !notification.isRead &&
    !hasActionTaken &&
    !isAlreadyProcessedType &&
    !isAlreadyProcessed;

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!orderId) return;

    setIsLoading("accept");
    try {
      const result = await updateOrderStatusAction(orderId, "PROCESSING");
      if (result.success) {
        setHasActionTaken(true);
        markAsRead(notification.id);
        onActionComplete?.();
      }
    } catch (error) {
      // console.error("Failed to accept order:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!orderId) return;

    setIsLoading("reject");
    try {
      const result = await updateOrderStatusAction(
        orderId,
        "CANCELLED",
        true,
        "Admin rejected from notification quick action"
      );
      if (result.success) {
        setHasActionTaken(true);
        markAsRead(notification.id);
        onActionComplete?.();
      }
    } catch (error) {
      // console.error("Failed to reject order:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ORDER":
      case "ORDER_PLACED":
      case "ADMIN_NEW_ORDER":
        return {
          bg: "bg-amber-50/50 dark:bg-amber-900/20",
          icon: "bg-amber-500",
          text: "text-amber-600 dark:text-amber-400",
          iconComponent: Package,
        };
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
        return {
          bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
          icon: "bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400",
          iconComponent: Check,
        };
      case "ORDER_CANCELLED":
        return {
          bg: "bg-red-50/50 dark:bg-red-900/10",
          icon: "bg-red-500",
          text: "text-red-600 dark:text-red-400",
          iconComponent: X,
        };
      default:
        return {
          bg: "bg-primary/5 dark:bg-primary/10",
          icon: "bg-primary",
          text: "text-primary",
          iconComponent: Package,
        };
    }
  };

  const styles = getTypeStyles(notification.type);
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b px-4 py-3 transition-colors last:border-0",
        !notification.isRead && styles.bg,
        "hover:bg-muted/50"
      )}
    >
      {/* Header: Icon + Title + Time */}
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => onClick(notification)}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            styles.icon
          )}
        >
          <IconComponent className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium truncate",
                !notification.isRead && "font-bold"
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: locale === "vi" ? vi : enUS,
            })}
          </p>
        </div>
      </div>

      {/* Quick Actions for Order Notifications */}
      {canTakeAction && (
        <div className="flex items-center gap-2 pl-12">
          <Button
            size="sm"
            variant="default"
            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
            onClick={handleAccept}
            disabled={isLoading !== null}
          >
            {isLoading === "accept" ? (
              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                {t("orders.statusMapping.PROCESSING")}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 px-3 text-xs"
            onClick={handleReject}
            disabled={isLoading !== null}
          >
            {isLoading === "reject" ? (
              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                {t("orders.statusMapping.CANCELLED")}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs ml-auto"
            onClick={() => onClick(notification)}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
