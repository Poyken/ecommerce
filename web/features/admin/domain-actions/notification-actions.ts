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
 * - Real-time Communication: Gửi thông báo tức thời tới hàng nghìn khách hàng về các sự kiện quan trọng (bảo trì, khuyến mãi) mà không cần khách phải tải lại trang.
 * - Operational Efficiency: Tự động hóa việc thông báo trạng thái đơn hàng cho khách, giảm bớt khối lượng công việc cho bộ phận CSKH.

 * =====================================================================
 */
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
