"use server";

import { http } from "@/lib/http";
import { ActionResult } from "@/types/dtos";
import { wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * NOTIFICATION ACTIONS - Gửi thông báo & Broadcast
 * =====================================================================
 */

export async function broadcastNotificationAction(
  data: any
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http("/notifications/admin/broadcast", {
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
    await http("/notifications/admin/send", {
      method: "POST",
      body: JSON.stringify({ ...data, userId }),
    });
  }, "Failed to send notification");
}
