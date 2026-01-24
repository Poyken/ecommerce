import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";

/**
 * =====================================================================
 * ADMIN NOTIFICATION SERVICE - Domain logic for admin notifications
 * =====================================================================
 */

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: string;
  link?: string;
}

export const adminNotificationService = {
  broadcastNotification: async (data: CreateNotificationDto) => {
    return http.post<ApiResponse<void>>("/notifications/admin/broadcast", data);
  },

  sendNotificationToUser: async (userId: string, data: CreateNotificationDto) => {
    return http.post<ApiResponse<void>>("/notifications/admin/send", {
      ...data,
      userId,
    });
  },
};
