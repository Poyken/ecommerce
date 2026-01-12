/**
 * =====================================================================
 * NOTIFICATION INITIALIZER - Khởi tạo Socket và Đồng bộ Thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SIDE EFFECT ENCAPSULATION:
 * - Phân tách việc quản lý Socket/Polling ra khỏi Layout hoặc App component.
 * - Chỉ cần mount 1 lần ở Root Layout để theo dõi thông báo xuyên suốt các trang.
 *
 * 2. SOCKET & POLLING HYBRID:
 * - Ưu tiên Socket để cập nhật Real-time (độ trễ thấp).
 * - Fallback Polling (mỗi 120s) và Visibility Check để đảm bảo data không bị "stale" nếu mất kết nối socket.
 *
 * 3. AUTH SYNC:
 * - Tự động connect socket khi có `accessToken` và dọn dẹp (cleanup) khi User logout. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { notificationSocket } from "@/lib/socket";
import { Notification } from "@/types/models";
import { useEffect, useRef, useState } from "react";

interface NotificationInitializerProps {
  userId?: string;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
  accessToken?: string;
}

export function NotificationInitializer({
  userId,
  initialNotifications,
  initialUnreadCount,
  accessToken,
}: NotificationInitializerProps) {
  const {
    setNotifications,
    setUnreadCount,

    addNotification,
    refresh,
  } = useNotificationStore();

  const [isInitialized, setIsInitialized] = useState(
    initialNotifications !== undefined
  );
  const lastUserId = useRef<string | undefined>(userId);

  // Sync initial data
  useEffect(() => {
    if (initialNotifications) {
      setNotifications(initialNotifications);
    }
    if (initialUnreadCount !== undefined) {
      setUnreadCount(initialUnreadCount);
    }
  }, [
    initialNotifications,
    initialUnreadCount,
    setNotifications,
    setUnreadCount,
  ]);

  // Initial fetch and re-fetch on userId change
  useEffect(() => {
    if (userId && (userId !== lastUserId.current || !isInitialized)) {
      refresh().then(() => {
        requestAnimationFrame(() => {
          setIsInitialized(true);
          lastUserId.current = userId;
        });
      });
    } else if (!userId && lastUserId.current) {
      // User logged out
      requestAnimationFrame(() => {
        setNotifications([]);
        setUnreadCount(0);
        setIsInitialized(false);
        lastUserId.current = undefined;
      });
    }
  }, [userId, isInitialized, refresh, setNotifications, setUnreadCount]);

  // WebSocket Integration
  useEffect(() => {
    if (!userId || !accessToken) return;

    notificationSocket.connect(accessToken);

    const handleNewNotification = (notification: Notification) => {
      addNotification(notification);
    };

    const handleUnreadCount = (count: number) => {
      setUnreadCount(count);
    };

    notificationSocket.on("notification", handleNewNotification);
    notificationSocket.on("unreadCount", handleUnreadCount);

    return () => {
      notificationSocket.off("notification", handleNewNotification);
      notificationSocket.off("unreadCount", handleUnreadCount);
    };
  }, [userId, accessToken, addNotification, setUnreadCount]);

  // Polling every 120 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, 120000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [userId, refresh]);

  return null;
}
