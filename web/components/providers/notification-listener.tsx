import { getSession } from "@/lib/session";
import { NotificationListenerClient } from "./notification-listener-client";

/**
 * =====================================================================
 * NOTIFICATION LISTENER - Server Component Wrapper
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-SIDE AUTH:
 * - Đây là một Server Component, cho phép truy cập trực tiếp vào Cookies/Session.
 * - Lấy `accessToken` từ server-side session trước khi render Client Component.
 *
 * 2. CONDITIONAL RENDERING:
 * - Nếu không có `accessToken` (người dùng chưa đăng nhập), component sẽ trả về `null`.
 * - Điều này giúp tiết kiệm tài nguyên, không khởi tạo kết nối WebSocket vô ích.
 *
 * 3. SECURITY:
 * - Việc lấy token ở server giúp bảo mật hơn, tránh lộ logic lấy token ở phía client.
 * =====================================================================
 */
export async function NotificationListener() {
  const accessToken = await getSession();

  if (!accessToken) {
    // User chưa login, không cần WebSocket
    return null;
  }

  return <NotificationListenerClient accessToken={accessToken} />;
}
