"use server";

import { fetchList, handleMutation } from "@/lib/action-helpers";
import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Notification } from "@/types/models";
import { cookies } from "next/headers";

/**
 * =====================================================================
 * NOTIFICATIONS SERVER ACTIONS - QUẢN LÝ THÔNG BÁO
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-TIME NOTIFICATIONS:
 * - Hệ thống sử dụng cơ chế kéo (Pull) qua API này và đẩy (Push) qua WebSocket (`NotificationsGateway` ở Backend).
 * - `getNotificationsAction`: Lấy danh sách thông báo để hiển thị trong chuông thông báo.
 *
 * 2. MARK AS READ:
 * - Khi user nhấn vào thông báo, ta gọi `markAsReadAction` để DB cập nhật `isRead = true`.
 * - Việc này giúp đồng bộ số lượng tin chưa đọc (Unread Count) chính xác.
 *
 * 3. ADMIN BROADCAST:
 * - Admin có quyền gửi thông báo tới tất cả người dùng (Broadcast) hoặc một người dùng cụ thể.
 * =====================================================================
 */

/**
 * Lấy danh sách thông báo của người dùng hiện tại.
 */
/**
 * Lấy danh sách thông báo của người dùng hiện tại.
 */
export async function getNotificationsAction(limit = 10) {
  await cookies();
  try {
    const res = await fetchList<Notification>("/notifications", {
      limit,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const res = await http<ApiResponse<{ count: number }>>(
      "/notifications/unread-count",
      {
        skipRedirectOn401: true,
      }
    );
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
export async function broadcastNotificationAction(data: {
  title: string;
  message: string;
  type?: string;
  link?: string;
  sendEmail?: boolean;
}) {
  return handleMutation(() =>
    http("/notifications/admin/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

export async function sendNotificationToUserAction(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  sendEmail?: boolean;
  email?: string;
}) {
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
