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

  setNotifications: (notifications) => set({ notifications }),

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
      const newNotifications = [notification, ...state.notifications].slice(
        0,
        10
      );
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
    // Optimistic
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await markAsReadServerAction(id);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Not refetching here to avoid store dependency on complex refetch logic
      // Initializer can handle deep sync if needed
    }
  },

  markAllAsRead: async () => {
    // Optimistic
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await markAllAsReadAction();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  },

  refresh: async () => {
    // This is a placeholder, implementation will likely be in Initializer
    // but we can expose it if we have access to fetch
    set({ isLoading: true });
    try {
      const [listRes, countRes] = await Promise.all([
        fetch("/api/v1/notifications?limit=10").then((r) => r.json()),
        fetch("/api/v1/notifications/unread-count").then((r) => r.json()),
      ]);

      if (listRes.data?.items) {
        set({ notifications: listRes.data.items });
      }

      if (typeof countRes.data?.count === "number") {
        set({ unreadCount: countRes.data.count });
      }
    } catch (e) {
      console.error("Store refresh failed", e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
