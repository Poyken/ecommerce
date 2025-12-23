"use client";

import { useToast } from "@/hooks/use-toast";
import { notificationSocket } from "@/lib/socket";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * =====================================================================
 * NOTIFICATION LISTENER CLIENT - Component xử lý thông báo real-time
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEBSOCKET CONNECTION:
 * - Sử dụng `notificationSocket` (Socket.io) để duy trì kết nối liên tục với server.
 * - `accessToken` được truyền từ Server Component để xác thực kết nối.
 * - Tự động `connect()` khi mount và `disconnect()` khi unmount để tránh rò rỉ bộ nhớ.
 *
 * 2. EVENT LISTENERS:
 * - `notification`: Nhận dữ liệu thông báo mới và hiển thị qua Toast.
 * - `unreadCount`: Cập nhật số lượng thông báo chưa đọc (nếu cần).
 *
 * 3. UX & FEEDBACK:
 * - Hiển thị Toast thông báo kết nối thành công để người dùng yên tâm.
 * - Tự động phân loại `variant` của Toast (success, warning, info) dựa trên `type` của thông báo.
 * =====================================================================
 */
export function NotificationListenerClient({
  accessToken,
}: {
  accessToken: string;
}) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);

  // Kết nối WebSocket
  useEffect(() => {
    console.log("[NotificationListener] Connecting to WebSocket with token...");
    notificationSocket.connect(accessToken);

    // Check connection
    const checkConnection = setTimeout(() => {
      const connected = notificationSocket.isConnected();
      setIsConnected(connected);
      console.log("[NotificationListener] Connection status:", connected);
    }, 1000);

    return () => {
      clearTimeout(checkConnection);
      notificationSocket.disconnect();
    };
  }, [accessToken]);

  // Lắng nghe thông báo mới
  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      console.log("[NotificationListener] New notification:", notification);
      setLatestNotification(notification);
    };

    notificationSocket.on("notification", handleNewNotification);

    return () => {
      notificationSocket.off("notification", handleNewNotification);
    };
  }, []);

  // Hiển thị toast khi connect
  useEffect(() => {
    if (isConnected) {
      console.log("✅ WebSocket connected successfully");
      toast({
        title: "Kết nối thông báo thành công",
        description: "Bạn sẽ nhận được thông báo real-time",
        variant: "success",
      });
    }
  }, [isConnected, toast]);

  // Hiển thị toast khi có thông báo mới
  useEffect(() => {
    if (latestNotification) {
      console.log("[NotificationListener] Showing toast:", latestNotification);

      // Chọn variant dựa vào type (Phân loại để người dùng dễ nhận biết)
      let variant: "default" | "success" | "destructive" | "warning" | "info" =
        "info";

      switch (latestNotification.type) {
        case "ORDER_PLACED":
        case "ORDER_DELIVERED":
          variant = "success";
          break;
        case "ORDER_CANCELLED":
        case "ORDER_RETURNED":
          variant = "warning";
          break;
        case "SYSTEM":
          variant = "info";
          break;
        default:
          variant = "default";
      }

      toast({
        title: latestNotification.title,
        description: latestNotification.link
          ? `${latestNotification.message}\n→ ${latestNotification.link}`
          : latestNotification.message,
        variant,
      });
    }
  }, [latestNotification, toast]);

  return null;
}
