"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

/**
 * =====================================================================
 * USE SOCKET - Hook quản lý kết nối WebSocket
 * =====================================================================
 */
export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Khởi tạo socket
    const socket = io(`${socketUrl}/notifications`, {
      auth: {
        token: session.accessToken,
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
  }, [session?.accessToken]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
