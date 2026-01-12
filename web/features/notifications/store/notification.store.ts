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
 * - Cung cấp hàm `refresh` để đồng bộ dữ liệu thủ công hoặc khi user quay lại app (visibility change). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Quản lý state toàn cục (Global State) hoặc cung cấp dependency injection cho cây component.

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

export const useNotificationStore = create<NotificationState>((set) => ({
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
    set({ isLoading: true });
    try {
      // Use Server Actions for data fetching
      const [listRes, countRes] = await Promise.all([
        import("@/features/notifications/actions").then((mod) =>
          mod.getNotificationsAction(10)
        ),
        import("@/features/notifications/actions").then((mod) =>
          mod.getUnreadCountAction()
        ),
      ]);

      if (listRes.data && Array.isArray(listRes.data)) {
        set({ notifications: listRes.data });
      }

      if (
        countRes.success &&
        countRes.data &&
        typeof countRes.data.count === "number"
      ) {
        set({ unreadCount: countRes.data.count });
      }
    } catch (e) {
      console.error("Store refresh failed", e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
