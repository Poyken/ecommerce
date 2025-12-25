import { env } from "@/lib/env";
import { io, Socket } from "socket.io-client";

/**
 * =====================================================================
 * STOCK SOCKET CLIENT - Kết nối cập nhật tồn kho real-time
 * =====================================================================
 */
class StockSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    const serverUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8088";
    // Usually API URL is like http://localhost:8088/api/v1, we need http://localhost:8088
    let wsBaseUrl = serverUrl;
    if (serverUrl.includes("/api/")) {
      wsBaseUrl = serverUrl.split("/api/")[0];
    } else if (serverUrl.includes("/api")) {
      wsBaseUrl = serverUrl.split("/api")[0];
    }

    // Convert to ws/wss if it starts with http/https
    const wsUrl = wsBaseUrl.replace(/^http/, "ws");

    this.socket = io(`${wsUrl}/stock`, {
      transports: ["websocket"],
      reconnection: true,
    });

    this.socket.on("stock_updated", (data) => {
      this.emit(`stock:${data.skuId}`, data.stock);
    });

    this.socket.on("global_stock_updated", (data) => {
      this.emit("global_stock", data);
    });
  }

  joinProduct(productId: string) {
    if (!this.socket?.connected) this.connect();
    this.socket?.emit("join_product", productId);
  }

  leaveProduct(productId: string) {
    this.socket?.emit("leave_product", productId);
  }

  onStockUpdate(skuId: string, callback: (stock: number) => void) {
    const event = `stock:${skuId}`;
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback as (data: unknown) => void);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback as (data: unknown) => void);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  private emit(event: string, data: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const stockSocket = new StockSocketClient();
