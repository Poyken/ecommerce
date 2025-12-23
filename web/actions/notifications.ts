/**
 * =====================================================================
 * NOTIFICATIONS SERVER ACTIONS - Quản lý thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các actions để xử lý thông báo cho người dùng và admin.
 * Hệ thống hỗ trợ thông báo thời gian thực (qua Socket.io) và lưu trữ DB.
 *
 * CÁC TÍNH NĂNG CHÍNH:
 * 1. Lấy danh sách thông báo của user.
 * 2. Đếm số thông báo chưa đọc.
 * 3. Đánh dấu thông báo là đã đọc (từng cái hoặc tất cả).
 * 4. Admin: Gửi thông báo cho toàn bộ user (Broadcast).
 * 5. Admin: Gửi thông báo cho một user cụ thể.
 *
 * ⚠️ LƯU Ý: Các action của Admin yêu cầu quyền quản trị tương ứng.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Interface định nghĩa cấu trúc một thông báo.
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

/**
 * Lấy danh sách thông báo của người dùng hiện tại.
 *
 * @param limit - Số lượng thông báo tối đa muốn lấy
 */
export async function getNotificationsAction(limit = 10) {
  await cookies();
  try {
    const res = await http<ApiResponse<Notification[]>>(
      `/notifications?limit=${limit}`,
      { skipRedirectOn401: true }
    );
    return { data: res.data };
  } catch (error: unknown) {
    const message = (error as Error).message || "";
    // Nếu chưa login, trả về mảng rỗng thay vì báo lỗi
    if (message.includes("401") || message.includes("Unauthorized")) {
      return { data: [] };
    }
    console.error("getNotificationsAction error:", error);
    return { data: [], error: message };
  }
}

/**
 * Lấy số lượng thông báo chưa đọc.
 * Dùng để hiển thị badge trên icon chuông thông báo.
 */
export async function getUnreadCountAction() {
  await cookies();
  try {
    const res = await http<ApiResponse<{ count: number }>>(
      "/notifications/unread-count",
      {
        skipRedirectOn401: true,
      }
    );
    return { count: res.data.count };
  } catch (error: unknown) {
    const message = (error as Error).message || "";
    if (message.includes("401") || message.includes("Unauthorized")) {
      return { count: 0 };
    }
    return { count: 0, error: message };
  }
}

/**
 * Đánh dấu một thông báo là đã đọc.
 *
 * @param id - ID của thông báo
 */
export async function markAsReadAction(id: string) {
  try {
    await http(`/notifications/${id}/read`, { method: "PATCH" });
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Đánh dấu tất cả thông báo của user là đã đọc.
 */
export async function markAllAsReadAction() {
  try {
    await http("/notifications/read-all", { method: "PATCH" });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * [ADMIN] Gửi thông báo cho tất cả người dùng hệ thống.
 */
export async function broadcastNotificationAction(data: {
  type: string;
  title: string;
  message: string;
  link?: string;
  sendEmail?: boolean;
}) {
  try {
    await http("/notifications/admin/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * [ADMIN] Gửi thông báo cho một người dùng cụ thể.
 */
export async function sendNotificationToUserAction(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  sendEmail?: boolean;
  email?: string;
}) {
  try {
    await http("/notifications/admin/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}
