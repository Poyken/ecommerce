import { env } from "@/lib/env";
import { io, Socket } from "socket.io-client";

/**
 * =====================================================================
 * STOCK SOCKET CLIENT - KẾT NỐI TỒN KHO THỜI GIAN THỰC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SINGLETON PATTERN:
 * - Chúng ta chỉ tạo một instance DUY NHẤT (`new StockSocketClient()`) và export nó.
 * - Đảm bảo toàn bộ ứng dụng dùng chung 1 kết nối WebSocket, tránh tạo hàng chục kết nối gây sập server.
 *
 * 2. OBSERVER PATTERN (Cơ chế đăng ký/lắng nghe):
 * - Map `listeners` lưu danh sách các component đang quan tâm đến 1 SKU.
 * - Khi Socket nhận `stock_updated` từ server -> Loop qua list này và gọi callback để update UI component đó.
 *
 * 3. IDEMPOTENCY (Tính lũy đẳng):
 * - Hàm `connect()` kiểm tra `if (this.socket?.connected) return;`.
 * - Gọi 100 lần cũng chỉ tạo 1 kết nối thực sự.
 * =====================================================================
 */
class StockSocketClient {
  // Biến lưu trữ kết nối socket thực tế
  private socket: Socket | null = null;

  // Map lưu trữ các hàm callback (listeners) cho từng sự kiện.
  // Key: tên sự kiện (vd: "stock:sku-123"), Value: mảng các hàm cần gọi khi có sự kiện.
  // Đây là triển khai thủ công của mẫu OBSERVER PATTERN.
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();

  /**
   * Khởi tạo kết nối tới Server
   */
  connect() {
    // Nếu đã kết nối rồi thì không làm gì cả (Idempotency)
    if (this.socket?.connected) return;

    // Lấy URL của API từ biến môi trường
    const serverUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

    // Xử lý URL: Socket.io cần base URL (vd: http://localhost:8088) chứ không phải full API path
    // Nếu URL là http://localhost:8088/api/v1 -> cắt bỏ phần /api trở đi
    let wsBaseUrl = serverUrl;
    if (serverUrl.includes("/api/")) {
      wsBaseUrl = serverUrl.split("/api/")[0];
    } else if (serverUrl.includes("/api")) {
      wsBaseUrl = serverUrl.split("/api")[0];
    }

    // Chuyển giao thức http -> ws (tùy chọn, socket.io tự xử lý được nhưng explicit tốt hơn)
    const wsUrl = wsBaseUrl.replace(/^http/, "ws");

    // Khởi tạo kết nối tới namespace "/stock"
    // Namespaces giúp tách biệt luồng dữ liệu, ví dụ: /chat, /notifications, /stock
    this.socket = io(`${wsUrl}/stock`, {
      transports: ["websocket"], // Bắt buộc dùng WebSocket, không fallback về HTTP Long-polling (tối ưu tốc độ)
      reconnection: true, // Tự động kết nối lại nếu rớt mạng
    });

    // Lắng nghe sự kiện từ Server: "stock_updated"
    // Khi server báo một SKU thay đổi số lượng, ta bắn sự kiện nội bộ tới các component đang theo dõi
    this.socket.on("stock_updated", (data) => {
      // data: { skuId: string, stock: number }
      this.emit(`stock:${data.skuId}`, data.stock);
    });

    // Lắng nghe sự kiện global (ví dụ: Reset kho toàn hệ thống)
    this.socket.on("global_stock_updated", (data) => {
      this.emit("global_stock", data);
    });
  }

  /**
   * Đăng ký vào "phòng" (room) của một Product.
   * Chỉ những client ở trong room này mới nhận được update của product đó.
   * -> Giảm tải băng thông (bandwidth optimization).
   */
  joinProduct(productId: string) {
    if (!this.socket?.connected) this.connect();
    this.socket?.emit("join_product", productId);
  }

  /**
   * Rời khỏi phòng khi user chuyển trang hoặc tắt component.
   */
  leaveProduct(productId: string) {
    this.socket?.emit("leave_product", productId);
  }

  /**
   * Hàm để Component đăng ký lắng nghe thay đổi của một SKU cụ thể.
   * @param skuId - ID của biến thể sản phẩm cần theo dõi
   * @param callback - Hàm sẽ chạy khi có update (React state setter thường được truyền vào đây)
   * @returns Hàm cleanup để hủy đăng ký (dùng trong useEffect return)
   */
  onStockUpdate(skuId: string, callback: (stock: number) => void) {
    const event = `stock:${skuId}`;

    // Nếu chưa có ai lắng nghe sự kiện này, tạo mảng mới
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    // Thêm callback vào danh sách
    this.listeners.get(event)!.push(callback as (data: unknown) => void);

    // Trả về hàm cleanup (Unsubscribe function)
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        // Tìm và xóa callback khỏi mảng
        const index = callbacks.indexOf(callback as (data: unknown) => void);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Bắn sự kiện nội bộ tới các listeners
   * (Private method: chỉ dùng bên trong class)
   */
  private emit(event: string, data: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * Ngắt kết nối hoàn toàn (thường ít dùng trong SPA, trừ khi logout hoặc tắt app)
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export một instance duy nhất (Singleton)
export const stockSocket = new StockSocketClient();
