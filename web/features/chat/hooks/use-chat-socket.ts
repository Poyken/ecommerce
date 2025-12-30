"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Update local ChatMessage interface to match models.ts or import it.
// Here we redefine for simplicity but should ideally import.
export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "USER" | "ADMIN";
  content: string;
  type?: "TEXT" | "IMAGE" | "PRODUCT" | "ORDER";
  metadata?: any;
  sentAt: string;
  clientTempId?: string;
  status?: "sending" | "sent" | "error";
  isRead?: boolean;
}

export function useChatSocket(
  accessToken: string | undefined,
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null,
  namespace = "/chat"
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !accessToken) return;

    // Initialize Socket
    // We need to strip '/api/v1' from the API URL to get the root URL for the socket
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
    ).replace(/\/api\/v1\/?$/, "");
    const socketUrl = `${baseUrl}${namespace}`;

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket"],
      path: "/socket.io/", // Ensure path matches NestJS Gateway default
    });

    socket.on("connect", () => {
      console.log("Chat Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Chat Disconnected");
      setIsConnected(false);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      setMessages((prev) => {
        // Check if we have a temp message with the same clientTempId
        if (message.clientTempId) {
          const tempIndex = prev.findIndex(
            (m) => m.clientTempId === message.clientTempId
          );
          if (tempIndex !== -1) {
            // Replace temp message with real one
            const newMessages = [...prev];
            newMessages[tempIndex] = { ...message, status: "sent" };
            return newMessages;
          }
        }

        // Prevent duplicates by ID just in case
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }

        // Increment unread count if message is from Admin and not read
        if (message.senderType === "ADMIN" && !message.isRead) {
          setUnreadCount((c) => c + 1);
        }

        return [...prev, { ...message, status: "sent" }];
      });
    });

    socket.on(
      "messageRead",
      (payload: { conversationId: string; userId: string }) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.senderType === "USER" && !m.isRead) {
              return { ...m, isRead: true };
            }
            return m;
          })
        );
      }
    );

    // Listen for history load
    socket.on("history", (history: ChatMessage[]) => {
      setMessages(history.map((m) => ({ ...m, status: "sent" })));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, accessToken, namespace]);

  const sendMessage = (
    content: string,
    toUserId?: string,
    type: "TEXT" | "IMAGE" | "PRODUCT" | "ORDER" = "TEXT",
    metadata?: any
  ) => {
    if (!user) return;

    // Generate temp ID
    const clientTempId = Date.now().toString();

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: `temp-${clientTempId}`,
      senderId: user.id,
      senderType: "USER",
      content,
      type,
      metadata,
      sentAt: new Date().toISOString(),
      clientTempId,
      status: "sending",
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    if (socketRef.current && isConnected) {
      socketRef.current.emit("sendMessage", {
        content,
        toUserId,
        clientTempId,
        type,
        metadata,
      });
    }
  };

  const markAsRead = (conversationId?: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("markAsRead", { conversationId });
    }
    setUnreadCount(0);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.senderType === "ADMIN" && !m.isRead) {
          return { ...m, isRead: true };
        }
        return m;
      })
    );
  };

  return {
    isConnected,
    messages,
    sendMessage,
    setMessages,
    unreadCount,
    setUnreadCount,
    markAsRead,
  };
}
