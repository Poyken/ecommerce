import { http } from "@/lib/http";

/**
 * =====================================================================
 * ADMIN NOTIFICATION SERVICE - Domain logic for admin notifications
 * =====================================================================
 */

export const adminNotificationService = {
  broadcastNotification: async (data: any) => {
    return http.post("/notifications/admin/broadcast", data);
  },

  sendNotificationToUser: async (userId: string, data: any) => {
    return http.post("/notifications/admin/send", { ...data, userId });
  },
};
