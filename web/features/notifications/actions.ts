"use server";

import { http } from "@/lib/http";
import { protectedActionClient } from "@/lib/safe-action";
import {
  createActionWrapper,
  createVoidActionWrapper,
  revalidatePaths,
} from "@/lib/safe-action-utils";
import { ApiResponse } from "@/types/dtos";
import { Notification } from "@/types/models";
import { cookies } from "next/headers";
import { z } from "zod";

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

// --- VALIDATION SCHEMAS ---

const MarkReadSchema = z.object({
  id: z.string(),
});

const BroadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().optional(),
  link: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

const SendUserSchema = BroadcastSchema.extend({
  userId: z.string(),
  email: z.string().email().optional(),
});

// --- SAFE ACTIONS (Mutations) ---

// Đánh dấu đã đọc
const safeMarkAsRead = protectedActionClient
  .schema(MarkReadSchema)
  .action(async ({ parsedInput }) => {
    await http(`/notifications/${parsedInput.id}/read`, { method: "PATCH" });
    revalidatePaths("/notifications");
    return { success: true };
  });

// Đánh dấu đọc hết
const safeMarkAllAsRead = protectedActionClient.action(async () => {
  await http("/notifications/read-all", { method: "PATCH" });
  revalidatePaths("/notifications");
  return { success: true };
});

// Admin Broadcast
const safeBroadcast = protectedActionClient
  .schema(BroadcastSchema)
  .action(async ({ parsedInput }) => {
    await http("/notifications/admin/broadcast", {
      method: "POST",
      body: JSON.stringify(parsedInput),
    });
    return { success: true };
  });

// Admin Send User
const safeSendUser = protectedActionClient
  .schema(SendUserSchema)
  .action(async ({ parsedInput }) => {
    await http("/notifications/admin/send", {
      method: "POST",
      body: JSON.stringify(parsedInput),
    });
    return { success: true };
  });

// --- EXPORTED ACTIONS (Wrappers) ---

export const markAsReadAction = async (id: string) => {
  const wrapper = createActionWrapper(safeMarkAsRead, "Failed to mark as read");
  return wrapper({ id });
};

export const markAllAsReadAction = createVoidActionWrapper(
  safeMarkAllAsRead,
  "Failed to mark all as read"
);

export const broadcastNotificationAction = createActionWrapper(
  safeBroadcast,
  "Failed to broadcast"
);

export const sendNotificationToUserAction = createActionWrapper(
  safeSendUser,
  "Failed to send notification"
);

// --- QUERY ACTIONS (Fetches) ---

/**
 * Lấy danh sách thông báo của người dùng hiện tại.
 */
export async function getNotificationsAction(limit = 10) {
  await cookies();
  try {
    const res = await http<ApiResponse<{ items: Notification[] }>>(
      `/notifications?limit=${limit}`,
      {
        skipRedirectOn401: true,
      }
    );
    // Support both formats if backend varies
    const items =
      (res.data as unknown as Notification[]) || res.data?.items || [];
    return { data: items };
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
 * [ADMIN] Lấy danh sách tất cả thông báo hệ thống.
 */
export async function getAdminNotificationsAction(
  page = 1,
  limit = 50,
  userId?: string,
  type?: string
) {
  await cookies();
  try {
    // Build query string
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (userId) params.append("userId", userId);
    if (type) params.append("type", type);

    const res = await http<ApiResponse<Notification[]>>(
      `/notifications/admin/all?${params.toString()}`
    );
    return {
      data: res.data || [],
      meta: res.meta,
    };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error",
    };
  }
}
