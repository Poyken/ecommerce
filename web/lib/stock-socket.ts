import { io, Socket } from "socket.io-client";
import { env } from "./env";



type StockUpdateCallback = (newStock: number) => void;

class StockSocketClient {
  private socket: Socket | null = null;
  private stockListeners: Map<string, Set<StockUpdateCallback>> = new Map();
  private connectedRooms: Set<string> = new Set();

  /**
   * Kết nối đến Stock Socket server
   */
  connect() {
    if (this.socket?.connected) {
      return;
    }

    // WebSocket server is at port 8080 (not /api/v1)
    const serverUrl = env.NEXT_PUBLIC_SOCKET_URL;

    this.socket = io(`${serverUrl}/stock`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    // Setup event handlers
    this.socket.on("connect", () => {
      // Rejoin rooms after reconnect
      this.connectedRooms.forEach((productId) => {
        this.socket?.emit("join_product", { productId });
      });
    });

    this.socket.on("disconnect", () => {});

    this.socket.on("connect_error", (error) => {
      console.error("[StockSocket] Connection error:", error.message);
    });

    // Listen for stock updates from server
    this.socket.on("stock_update", (data: { skuId: string; stock: number }) => {
      const callbacks = this.stockListeners.get(data.skuId);
      if (callbacks) {
        callbacks.forEach((callback) => callback(data.stock));
      }
    });
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedRooms.clear();
    }
  }

  /**
   * Join room để nhận updates cho một Product cụ thể
   */
  joinProduct(productId: string) {
    if (!this.socket?.connected) {
      this.connect();
    }
    if (!this.connectedRooms.has(productId)) {
      this.socket?.emit("join_product", { productId });
      this.connectedRooms.add(productId);
    }
  }

  /**
   * Leave room khi không cần nhận updates nữa
   */
  leaveProduct(productId: string) {
    if (this.socket?.connected && this.connectedRooms.has(productId)) {
      this.socket.emit("leave_product", { productId });
      this.connectedRooms.delete(productId);
    }
  }

  /**
   * Đăng ký lắng nghe stock updates cho một SKU cụ thể
   * @returns Unsubscribe function
   */
  onStockUpdate(skuId: string, callback: StockUpdateCallback): () => void {
    if (!this.stockListeners.has(skuId)) {
      this.stockListeners.set(skuId, new Set());
    }
    this.stockListeners.get(skuId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.stockListeners.get(skuId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.stockListeners.delete(skuId);
        }
      }
    };
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const stockSocket = new StockSocketClient();
