"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * =====================================================================
 * USE SOCKET - Hook quản lý kết nối WebSocket
 * =====================================================================
 */
export function useSocket() {
  const { accessToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Khởi tạo socket
    const socket = io(`${socketUrl}/notifications`, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[WS] Connected to notifications gateway");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[WS] Disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("[WS] Connection Error:", error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
