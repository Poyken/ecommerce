"use server";

import { protectedActionClient } from "@/lib/safe-action";
import {
  REVALIDATE,
  wrapServerAction,
  createActionWrapper,
  createVoidActionWrapper,
} from "@/lib/safe-action";
import { ApiResponse, ActionResult } from "@/types/api";
import { Notification } from "@/types/models";
import { cookies } from "next/headers";
import { z } from "zod";



import { notificationService } from "./services/notification.service";

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
    await notificationService.markAsRead(parsedInput.id);
    REVALIDATE.admin.notifications();
    return { success: true };
  });

// Đánh dấu đọc hết
const safeMarkAllAsRead = protectedActionClient.action(async () => {
  await notificationService.markAllAsRead();
  REVALIDATE.admin.notifications();
  return { success: true };
});

// Admin Broadcast
const safeBroadcast = protectedActionClient
  .schema(BroadcastSchema)
  .action(async ({ parsedInput }) => {
    await notificationService.broadcast(parsedInput);
    return { success: true };
  });

// Admin Send User
const safeSendUser = protectedActionClient
  .schema(SendUserSchema)
  .action(async ({ parsedInput }) => {
    await notificationService.sendToUser(parsedInput);
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
export async function getNotificationsAction(
  limit = 10
): Promise<ActionResult<Notification[]>> {
  await cookies();
  return wrapServerAction(
    () => notificationService.getNotifications(limit),
    "Failed to fetch notifications"
  );
}

/**
 * Lấy số lượng thông báo chưa đọc.
 */
export async function getUnreadCountAction(): Promise<
  ActionResult<{ count: number }>
> {
  await cookies();
  return wrapServerAction(async () => {
    const res = await notificationService.getUnreadCount();
    return { count: typeof res.data === "number" ? res.data : 0 };
  }, "Failed to fetch unread count");
}

/**
 * [ADMIN] Lấy danh sách tất cả thông báo hệ thống.
 */
export async function getAdminNotificationsAction(
  page = 1,
  limit = 50,
  userId?: string,
  type?: string
): Promise<ActionResult<Notification[]>> {
  await cookies();
  return wrapServerAction(
    () => notificationService.getAdminNotifications(page, limit, userId, type),
    "Failed to fetch admin notifications"
  );
}
