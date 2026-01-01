"use server";

import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";

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
 * =====================================================================
 * NOTIFICATIONS SERVER ACTIONS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Quản lý việc lấy, đếm và đánh dấu đã đọc thông báo.
 * - Sử dụng `revalidatePath` chưa triệt để ở một số chỗ vì thông báo thường được cập nhật Realtime qua Socket.IO.
 * - Server Actions ở đây chủ yếu phục vụ việc lấy dữ liệu tĩnh ban đầu (Initial Fetch).
 * =====================================================================
 */

import { cookies } from "next/headers";

export async function getNotificationsAction(limit = 10) {
  await cookies();
  try {
    const res = await http<{ items: Notification[] }>(
      `/notifications?limit=${limit}`,
      { skipRedirectOn401: true }
    );
    return { data: res.items };
  } catch (error: unknown) {
    const message = (error as Error).message || "";
    if (message.includes("401") || message.includes("Unauthorized")) {
      return { data: [] };
    }
    console.error("getNotificationsAction error:", error);
    return { data: [], error: message };
  }
}

export async function getUnreadCountAction() {
  await cookies();
  try {
    const res = await http<{ count: number }>("/notifications/unread-count", {
      skipRedirectOn401: true,
    });
    return { count: res.count };
  } catch (error: unknown) {
    const message = (error as Error).message || "";
    if (message.includes("401") || message.includes("Unauthorized")) {
      return { count: 0 };
    }
    return { count: 0, error: message };
  }
}

export async function markAsReadAction(id: string) {
  try {
    await http(`/notifications/${id}/read`, { method: "PATCH" });
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function markAllAsReadAction() {
  try {
    await http("/notifications/read-all", { method: "PATCH" });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

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
