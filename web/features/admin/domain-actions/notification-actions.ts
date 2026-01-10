"use server";

import { http } from "@/lib/http";
import { ApiResponse, ActionResult } from "@/types/dtos";
import { wrapServerAction } from "@/lib/safe-action-utils";

/**
 * =====================================================================
 * NOTIFICATION ACTIONS - Gửi thông báo & Broadcast
 * =====================================================================
 */

export async function broadcastNotificationAction(
  data: any
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http("/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }, "Failed to broadcast notification");
}

export async function sendNotificationToUserAction(
  userId: string,
  data: any
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/notifications/user/${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }, "Failed to send notification");
}
