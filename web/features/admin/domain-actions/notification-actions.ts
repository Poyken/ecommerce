/**
 * =====================================================================
 * NOTIFICATION ACTIONS - Gửi thông báo hệ thống
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BROADCAST vs UNICAST:
 * - `broadcastNotificationAction`: Gửi cho TẤT CẢ user (hoặc nhóm user).
 *   VD: "Hệ thống bảo trì 2h tới".
 * - `sendNotificationToUserAction`: Gửi cho 1 User cụ thể.
 *   VD: "Đơn hàng #123 của bạn đã được giao".
 *
 * 2. REAL-TIME:
 * - Backend sau khi nhận request sẽ đẩy qua WebSocket (Socket.IO) tới client đang online. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */
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
