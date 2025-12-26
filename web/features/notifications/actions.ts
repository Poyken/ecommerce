"use server";

import { fetchList, handleMutation } from "@/lib/action-helpers";
import { http } from "@/lib/http";
import { Notification } from "@/types/models";
import { cookies } from "next/headers";

/**
 * =====================================================================
 * NOTIFICATIONS SERVER ACTIONS - Quản lý thông báo (REFACTORED)
 * =====================================================================
 */

/**
 * Lấy danh sách thông báo của người dùng hiện tại.
 */
export async function getNotificationsAction(limit = 10) {
  await cookies();
  try {
    const res = await fetchList<Notification>("/notifications", {
      limit,
      skipRedirectOn401: true,
    } as any);
    return { data: res.data || [] };
  } catch (error) {
    return { data: [] };
  }
}

/**
 * Lấy số lượng thông báo chưa đọc.
 */
export async function getUnreadCountAction() {
  await cookies();
  try {
    const res = await http<any>("/notifications/unread-count", {
      skipRedirectOn401: true,
    });
    return { count: res.data?.count || 0 };
  } catch (error) {
    return { count: 0 };
  }
}

/**
 * Đánh dấu một thông báo là đã đọc.
 */
export async function markAsReadAction(id: string) {
  return handleMutation(
    () => http(`/notifications/${id}/read`, { method: "PATCH" }),
    { revalidatePaths: ["/notifications"] }
  );
}

/**
 * Đánh dấu tất cả thông báo của user là đã đọc.
 */
export async function markAllAsReadAction() {
  return handleMutation(
    () => http("/notifications/read-all", { method: "PATCH" }),
    { revalidatePaths: ["/notifications"] }
  );
}

/**
 * [ADMIN] Gửi thông báo (Broadcast hoặc tới User cụ thể).
 */
export async function broadcastNotificationAction(data: any) {
  return handleMutation(() =>
    http("/notifications/admin/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

export async function sendNotificationToUserAction(data: any) {
  return handleMutation(() =>
    http("/notifications/admin/send", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

/**
 * [ADMIN] Lấy danh sách tất cả thông báo hệ thống.
 */
export async function getAdminNotificationsAction(
  page = 1,
  limit = 50,
  userId?: string,
  type?: string
) {
  return fetchList<Notification>("/notifications/admin/all", {
    page,
    limit,
    userId,
    type,
  });
}
