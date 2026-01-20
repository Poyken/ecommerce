/**
 * =====================================================================
 * NOTIFICATIONS CLIENT - Giao diện danh sách thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-TIME UPDATES:
 * - Sử dụng `useNotifications` hook từ `NotificationProvider`.
 * - Tự động cập nhật danh sách thông báo qua WebSocket khi có sự kiện mới từ server.
 *
 * 2. INTERACTION FLOW:
 * - Khi click vào thông báo: Đánh dấu là đã đọc (`markAsRead`) và mở Dialog chi tiết.
 * - Hỗ trợ lọc thông báo (Tất cả / Chưa đọc).
 * - Hỗ trợ "Đánh dấu tất cả là đã đọc" để cải thiện trải nghiệm người dùng.
 *
 * 3. DYNAMIC STYLING:
 * - `getTypeIcon` và `getTypeStyles`: Tự động thay đổi icon và màu sắc dựa trên loại thông báo (Order, Promo, System...). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Real-time Engagement Loop: Duy trì kết nối liên tục giữa nền tảng và người dùng, đảm bảo khách hàng nhận được các thông tin quan trọng về đơn hàng và khuyến mãi ngay lập tức qua WebSocket.
 * - Contextual Feedback System: Chuyển đổi các sự kiện hệ thống khô khan thành những thông báo có tính tương tác cao, giúp điều hướng người dùng tới các khu vực chức năng liên quan một cách tự nhiên.

 * =====================================================================
 */

"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { type Notification } from "@/types/models";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Package,
  ShoppingBag,
  Tag,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NotificationsClient() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const filteredNotifications = safeNotifications.filter((n: Notification) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ORDER":
      case "ORDER_PROCESSING":
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
      case "ORDER_CANCELLED":
      case "ORDER_RETURNED":
        return <ShoppingBag className="w-5 h-5" />;
      case "LOW_STOCK":
        return <Package className="w-5 h-5" />;
      case "PROMO":
        return <Tag className="w-5 h-5" />;
      case "SYSTEM":
        return <Zap className="w-5 h-5" />;
      case "REVIEW_REPLY":
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ORDER":
      case "ORDER_PROCESSING":
        return "bg-success/10 text-success border-success/20";
      case "ORDER_SHIPPED":
        return "bg-info/10 text-info border-info/20";
      case "ORDER_DELIVERED":
        return "bg-success/10 text-success border-success/20";
      case "ORDER_CANCELLED":
      case "ORDER_RETURNED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "LOW_STOCK":
        return "bg-warning/10 text-warning border-warning/20";
      case "PROMO":
        return "bg-accent/10 text-accent border-accent/20";
      case "SYSTEM":
        return "bg-info/10 text-info border-info/20";
      case "REVIEW_REPLY":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted/50 text-muted-foreground border-muted";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 relative overflow-hidden transition-colors duration-500 font-sans">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 max-w-7xl z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
               <Bell className="size-3" />
               <span>Alerts</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
              <span className="block">{t("title")}</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Stay Updated</span>
            </h1>
            <p className="text-xl text-muted-foreground/80 font-medium max-w-xl">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  filter === "all"
                    ? "bg-white dark:bg-neutral-800 shadow-lg text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("all")}
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  filter === "unread"
                    ? "bg-white dark:bg-neutral-800 shadow-lg text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("unreadOnly")}
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-sm"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t("markAllRead")}</span>
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {filteredNotifications.length > 0 ? (
            <m.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredNotifications.map((notification: Notification) => (
                <m.div key={notification.id} variants={itemVariants}>
                  <GlassCard
                    onClick={() => {
                      markAsRead(notification.id);
                      setSelectedNotification(notification);
                    }}
                    className={cn(
                      "p-6 cursor-pointer transition-all duration-300 border border-transparent hover:border-primary/20 group",
                      !notification.isRead &&
                        "bg-primary/5 border-primary/10 shadow-lg shadow-primary/5"
                    )}
                  >
                    <div className="flex gap-6 items-start">
                      <div
                        className={cn(
                          "w-14 h-14 shrink-0 rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                          getTypeStyles(notification.type)
                        )}
                      >
                        {getTypeIcon(notification.type)}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h3
                            className={cn(
                              "text-lg font-bold tracking-tight transition-colors",
                              !notification.isRead
                                ? "text-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            {notification.title}
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                                locale: locale === "vi" ? vi : enUS,
                              }
                            )}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "text-base leading-relaxed",
                            !notification.isRead
                              ? "text-muted-foreground"
                              : "text-muted-foreground/60"
                          )}
                        >
                          {notification.message}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <div className="w-3 h-3 rounded-full bg-primary mt-2 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                      )}
                    </div>
                  </GlassCard>
                </m.div>
              ))}
            </m.div>
          ) : (
            <m.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-12 h-12 text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("empty")}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t("emptyDesc")}
                </p>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Notification Detail Dialog */}
        <Dialog
          open={!!selectedNotification}
          onOpenChange={(open) => !open && setSelectedNotification(null)}
        >
          <DialogContent className="sm:max-w-md">
            {selectedNotification && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "p-2 rounded-lg border",
                        getTypeStyles(selectedNotification.type)
                      )}
                    >
                      {getTypeIcon(selectedNotification.type)}
                    </div>
                    <DialogTitle>{selectedNotification.title}</DialogTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs pt-2">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">
                      {selectedNotification.type}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(selectedNotification.createdAt),
                        {
                          addSuffix: true,
                          locale: locale === "vi" ? vi : enUS,
                        }
                      )}
                    </span>
                  </div>
                </DialogHeader>
                <DialogDescription className="text-base leading-relaxed whitespace-pre-wrap py-4">
                  {selectedNotification.message}
                </DialogDescription>
                <DialogFooter className="flex-row gap-2 sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1"
                  >
                    {t("close") || "Close"}
                  </Button>
                  {selectedNotification.link && (
                    <Button
                      onClick={() => {
                        setSelectedNotification(null);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        router.push((selectedNotification.link || "/") as any);
                      }}
                      className="flex-1 gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("viewDetails") || "View Details"}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
