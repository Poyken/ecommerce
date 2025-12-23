"use client";

import { notificationSocket } from "@/lib/socket";
import { Notification } from "@/types/models";
import { useCallback, useEffect, useState } from "react";

/**
 * =====================================================================
 * USE NOTIFICATIONS HOOK - Hook quản lý thông báo qua WebSocket
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLIENT-SIDE SOCKET INIT:
 * - Hook này chịu trách nhiệm khởi tạo kết nối WebSocket trực tiếp từ phía Client.
 * - Lấy `accessToken` từ cookie để xác thực với Socket server.
 *
 * 2. EVENT HANDLING:
 * - `notification`: Nhận thông báo mới và lưu vào `latestNotification`.
 * - `unreadCount`: Cập nhật số lượng thông báo chưa đọc.
 *
 * 3. CLEANUP:
 * - Tự động gỡ bỏ các listener (`off`) khi component unmount để tránh rò rỉ bộ nhớ và duplicate thông báo.
 * =====================================================================
 */
export function useNotifications() {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);

  // Kết nối WebSocket khi component mount
  useEffect(() => {
    // Get token from cookie
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return undefined;
    };

    const token = getCookieValue("accessToken");

    if (token) {
      console.log("[useNotifications] Connecting to WebSocket...");
      notificationSocket.connect(token);

      // Đợi một chút để socket kết nối
      const checkConnection = setTimeout(() => {
        setIsConnected(notificationSocket.isConnected());
      }, 500);

      return () => clearTimeout(checkConnection);
    } else {
      console.log("[useNotifications] No access token found");
    }
  }, []); // Run once on mount

  // Lắng nghe events từ socket
  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      console.log("[useNotifications] New notification:", notification);
      setLatestNotification(notification);
    };

    const handleUnreadCount = (count: number) => {
      console.log("[useNotifications] Unread count:", count);
      setUnreadCount(count);
    };

    notificationSocket.on("notification", handleNewNotification);
    notificationSocket.on("unreadCount", handleUnreadCount);

    return () => {
      notificationSocket.off("notification", handleNewNotification);
      notificationSocket.off("unreadCount", handleUnreadCount);
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    notificationSocket.markAsRead(id);
  }, []);

  const getNotifications = useCallback((limit?: number, offset?: number) => {
    notificationSocket.getNotifications(limit, offset);
  }, []);

  return {
    isConnected,
    unreadCount,
    latestNotification,
    markAsRead,
    getNotifications,
  };
}
