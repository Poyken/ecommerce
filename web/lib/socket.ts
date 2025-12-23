import { io, Socket } from "socket.io-client";

/**
 * =====================================================================
 * WEBSOCKET CLIENT - Kết nối real-time notifications
 * =====================================================================
 *
 * 📚 GIẢI THÍCH:
 *
 * 1. SINGLETON PATTERN:
 * - Chỉ tạo 1 WebSocket connection duy nhất cho toàn app
 * - Tránh tạo nhiều connections không cần thiết
 *
 * 2. AUTO-RECONNECT:
 * - Socket.io tự động reconnect khi mất kết nối
 * - Retry logic được xử lý tự động
 *
 * 3. AUTHENTICATION:
 * - Gửi JWT token khi connect
 * - Server sẽ verify token và join user vào room riêng
 * =====================================================================
 */

class NotificationSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();

  /**
   * Kết nối đến Socket.io server
   */
  connect(token: string) {
    if (this.socket?.connected) {
      console.log("[Socket] Already connected");
      return;
    }

    // WebSocket server is at port 8080 (not /api/v1)
    const serverUrl = "http://localhost:8080";

    this.socket = io(`${serverUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Setup event handlers
    this.socket.on("connect", () => {
      console.log("[Socket] Connected successfully");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });

    // Lắng nghe các events từ server
    this.socket.on("new_notification", (notification) => {
      this.emit("notification", notification);
    });

    this.socket.on("unread_count", (data) => {
      this.emit("unreadCount", data.count);
    });

    this.socket.on("error", (error) => {
      console.error("[Socket] Error:", error);
    });
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("[Socket] Disconnected manually");
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Đăng ký listener cho events
   */
  on<T>(event: string, callback: (data: T) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback as (data: unknown) => void);
  }

  /**
   * Hủy đăng ký listener
   */
  off<T>(event: string, callback?: (data: T) => void) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback as (data: unknown) => void);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event đến các listeners
   */
  private emit<T>(event: string, data: T) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Gửi event đến server
   */
  send(event: string, data?: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("[Socket] Not connected, cannot send event:", event);
    }
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  markAsRead(id: string) {
    this.send("mark_as_read", { id });
  }

  /**
   * Lấy danh sách thông báo
   */
  getNotifications(limit?: number, offset?: number) {
    this.send("get_notifications", { limit, offset });
  }
}

// Export singleton instance
export const notificationSocket = new NotificationSocketClient();
