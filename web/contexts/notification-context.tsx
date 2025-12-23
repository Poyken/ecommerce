"use client";

import {
  markAllAsReadAction,
  markAsReadAction as markAsReadServerAction,
} from "@/actions/notifications";
import { notificationSocket } from "@/lib/socket";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
/**
 * =====================================================================
 * NOTIFICATION CONTEXT - Quản lý trạng thái thông báo toàn ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL STATE MANAGEMENT:
 * - Sử dụng React Context để chia sẻ danh sách thông báo và số lượng chưa đọc (`unreadCount`) cho toàn bộ app.
 * - Giúp các component như `NotificationCenter` hay `Header` luôn đồng bộ dữ liệu.
 *
 * 2. OPTIMISTIC UPDATES:
 * - Khi user nhấn "Đánh dấu đã đọc", ta cập nhật UI ngay lập tức (`setNotifications`, `setUnreadCount`) trước khi gọi API.
 * - Tạo cảm giác ứng dụng phản hồi cực nhanh (Instant feedback).
 *
 * 3. HYBRID SYNC (WebSocket + Polling):
 * - WebSocket: Nhận thông báo real-time ngay khi có sự kiện từ server.
 * - Polling (30s): Cơ chế dự phòng nếu kết nối WebSocket bị gián đoạn.
 *
 * 4. NEXT.JS REWRITES:
 * - Fetch trực tiếp tới `/api/v1/notifications` thay vì full URL.
 * - Browser sẽ tự động đính kèm HttpOnly Cookies, giúp xác thực an toàn mà không cần code thêm.
 * =====================================================================
 */

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
  userId,
  initialNotifications,
  initialUnreadCount,
  accessToken,
}: {
  children: React.ReactNode;
  userId?: string;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
  accessToken?: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications || []
  );
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(
    initialNotifications !== undefined
  );
  const [lastUserId, setLastUserId] = useState<string | undefined>(userId);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      // Use Next.js Rewrites (configured in next.config.ts)
      // Requests to /api/v1/* are proxied to Backend, cookies are forwarded automatically
      const [listRes, countRes] = await Promise.all([
        fetch("/api/v1/notifications?limit=10").then((r) => r.json()),
        fetch("/api/v1/notifications/unread-count").then((r) => r.json()),
      ]);

      if (listRes.data?.items) {
        setNotifications(listRes.data.items);
      }

      if (typeof countRes.data?.count === "number") {
        setUnreadCount(countRes.data.count);
      }
    } catch (error) {
      console.error(
        "[NotificationContext] Failed to fetch notifications",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markAsReadServerAction(id);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Revert on error? For now, just log.
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await markAllAsReadAction();
    } catch (error) {
      console.error("Failed to mark all as read", error);
      fetchNotifications();
    }
  };

  // Initial fetch and re-fetch on userId change
  useEffect(() => {
    if (userId && (userId !== lastUserId || !isInitialized)) {
      fetchNotifications().then(() => {
        setIsInitialized(true);
        setLastUserId(userId);
      });
    } else if (!userId && lastUserId) {
      // User logged out
      setNotifications([]);
      setUnreadCount(0);
      setIsInitialized(false);
      setLastUserId(undefined);
    }
  }, [userId, lastUserId, isInitialized, fetchNotifications]);

  // WebSocket Integration
  useEffect(() => {
    if (!userId || !accessToken) {
      console.log("[NotificationContext] No userId or token for WebSocket");
      return;
    }

    console.log("[NotificationContext] Connecting to WebSocket...");
    notificationSocket.connect(accessToken);

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      console.log(
        "[NotificationContext] New notification via WebSocket:",
        notification
      );

      // Add to the beginning of the list
      setNotifications((prev) => [notification, ...prev].slice(0, 10));

      // Increment unread count if notification is unread
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleUnreadCount = (count: number) => {
      console.log(
        "[NotificationContext] Unread count update via WebSocket:",
        count
      );
      setUnreadCount(count);
    };

    notificationSocket.on("notification", handleNewNotification);
    notificationSocket.on("unreadCount", handleUnreadCount);

    return () => {
      notificationSocket.off("notification", handleNewNotification);
      notificationSocket.off("unreadCount", handleUnreadCount);
    };
  }, [userId, accessToken]);

  // Polling every 30 seconds (backup to WebSocket)
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
