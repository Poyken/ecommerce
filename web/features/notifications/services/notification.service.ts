import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse } from "@/types/api";
import { Notification } from "@/types/models";

/**
 * =====================================================================
 * NOTIFICATION SERVICE - Domain logic for notifications
 * =====================================================================
 */

export const notificationService = {
  // --- USER ACTIONS ---

  /**
   * Get current user's notifications
   */
  getNotifications: async (limit = 10) => {
    return http.get<ApiResponse<Notification[]>>(
      `/notifications?limit=${limit}`,
      { skipRedirectOn401: true }
    );
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    return http.get<ApiResponse<number>>("/notifications/unread-count", {
      skipRedirectOn401: true,
    });
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id: string) => {
    return http.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return http.patch("/notifications/read-all");
  },

  // --- ADMIN ACTIONS ---

  /**
   * [ADMIN] Get all notifications
   */
  getAdminNotifications: async (
    page = 1,
    limit = 50,
    userId?: string,
    type?: string
  ) => {
    const params = normalizePaginationParams(page, limit);
    if (userId) params.userId = userId;
    if (type) params.type = type;

    return http.get<ApiResponse<Notification[]>>("/notifications/admin/all", {
      params,
    });
  },

  /**
   * [ADMIN] Broadcast to all users
   */
  broadcast: async (data: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    sendEmail?: boolean;
  }) => {
    return http.post("/notifications/admin/broadcast", data);
  },

  /**
   * [ADMIN] Send to specific user
   */
  sendToUser: async (data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
    sendEmail?: boolean;
    email?: string;
  }) => {
    return http.post("/notifications/admin/send", data);
  },
};
