
"use server";

import {
  adminNotificationService,
  CreateNotificationDto,
} from "../services/admin-notification.service";
import { ActionResult } from "@/types/dtos";
import { wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * NOTIFICATION ACTIONS - Gửi thông báo & Broadcast
 * =====================================================================
 */

export async function broadcastNotificationAction(
  data: CreateNotificationDto
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminNotificationService.broadcastNotification(data);
  }, "Failed to broadcast notification");
}

export async function sendNotificationToUserAction(
  userId: string,
  data: CreateNotificationDto
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminNotificationService.sendNotificationToUser(userId, data);
  }, "Failed to send notification");
}
