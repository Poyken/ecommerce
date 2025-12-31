/**
 * =====================================================================
 * NOTIFICATION STORE - Quản lý trạng thái thông báo toàn ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ZUSTAND STATE MANAGEMENT:
 * - Thay thế Context API cũ để tối ưu hiệu năng (chỉ re-render những component thực sự dùng dữ liệu).
 * - Tách biệt logic xử lý data (`actions`) khỏi UI components.
 *
 * 2. OPTIMISTIC UPDATES:
 * - `addNotification`: Khi có thông báo mới từ Socket, ta cập nhật store ngay lập tức để user thấy badge nhảy số mà không cần load lại trang.
 * - Store tự động slice list thông báo để giữ bộ nhớ nhẹ (tối đa 10 cái mới nhất).
 *
 * 3. REFRESH LOGIC:
 * - Cung cấp hàm `refresh` để đồng bộ dữ liệu thủ công hoặc khi user quay lại app (visibility change).
 * =====================================================================
 */

import {
  markAllAsReadAction,
  markAsReadAction as markAsReadServerAction,
} from "@/features/notifications/actions";
import { Notification } from "@/types/models";
import { create } from "zustand";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
  setIsLoading: (isLoading: boolean) => void;

  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Logic for refetching can be triggered via Initializer or by exposing a refresh function
  // but to keep it store-centric:
  refresh: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) =>
    set({ notifications: Array.isArray(notifications) ? notifications : [] }),

  setUnreadCount: (countOrFn) =>
    set((state) => ({
      unreadCount:
        typeof countOrFn === "function"
          ? countOrFn(state.unreadCount)
          : countOrFn,
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  addNotification: (notification) => {
    set((state) => {
      const currentList = Array.isArray(state.notifications)
        ? state.notifications
        : [];
      const newNotifications = [notification, ...currentList].slice(0, 10);
      const newUnreadCount = notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1;
      return {
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    });
  },

  markAsRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: (Array.isArray(state.notifications)
        ? state.notifications
        : []
      ).map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      // Call API but don't refresh - optimistic update is sufficient
      await markAsReadServerAction(id);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  },

  markAllAsRead: async () => {
    // Optimistic update - mark all as read locally
    set((state) => ({
      notifications: (Array.isArray(state.notifications)
        ? state.notifications
        : []
      ).map((n) => ({
        ...n,
        isRead: true,
      })),
      unreadCount: 0,
    }));

    try {
      // Call API but don't refresh - optimistic update is sufficient
      await markAllAsReadAction();
    } catch (error) {
      console.error("Failed to mark all as read", error);
      // Could revert here but typically server action succeeds
    }
  },

  refresh: async () => {
    // This is a placeholder, implementation will likely be in Initializer
    // but we can expose it if we have access to fetch
    set({ isLoading: true });
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const [listRes, countRes] = await Promise.all([
        fetch(`${apiUrl}/notifications?limit=10`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((r) => r.json()),
        fetch(`${apiUrl}/notifications/unread-count`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((r) => r.json()),
      ]);

      // API returns { data: { items: [], unreadCount: number } }
      if (listRes.data && Array.isArray(listRes.data.items)) {
        set({ notifications: listRes.data.items });
        // Also get unreadCount from list response if available
        if (typeof listRes.data.unreadCount === "number") {
          set({ unreadCount: listRes.data.unreadCount });
        }
      } else if (Array.isArray(listRes.data)) {
        set({ notifications: listRes.data });
      }

      // API returns { data: number } for unread count
      if (typeof countRes.data === "number") {
        set({ unreadCount: countRes.data });
      } else if (typeof countRes.data?.count === "number") {
        set({ unreadCount: countRes.data.count });
      }
    } catch (e) {
      console.error("Store refresh failed", e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
