"use client";

import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Update local ChatMessage interface to match models.ts or import it.
// Here we redefine for simplicity but should ideally import.
export interface ChatMessage {
  id: string;
  conversationId: string;
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
  /**
   * =====================================================================
   * USE CHAT SOCKET - Hook quản lý kết nối WebSocket
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. REAL-TIME COMMUNICATION:
   * - Sử dụng `socket.io-client` để kết nối tới Admin Backend.
   * - Namespace: `/chat` (định nghĩa luồng dữ liệu riêng biệt).
   *
   * 2. OPTIMISTIC UPDATES:
   * - Khi user gửi tin nhắn, ta hiển thị ngay lập tức (Status: sending) trước khi Server phản hồi.
   * - Giúp trải nghiệm người dùng mượt mà hơn.
   *
   * 3. DEDUPLICATION STRATEGY:
   * - WebSocket có thể nhận tin nhắn trùng lặp do mạng chập chờn.
   * - Sử dụng `processedMessageIdsRef` (Set) để đảm bảo mỗi tin nhắn chỉ được xử lý 1 lần. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Hook React tùy chỉnh để tách biệt logic khỏi UI, giúp component dễ đọc và dễ test hơn.

   * =====================================================================
   */
  accessToken: string | undefined,
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null,
  isChatOpen: boolean = false, // New param
  namespace = "/chat"
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Track processed message IDs to prevent duplication
  const processedMessageIdsRef = useRef(new Set<string>());
  // Keep track of current messages for duplication check without dependency cycle
  const messagesRef = useRef(messages);
  // Track open state in ref to avoid reconnecting socket
  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Sync processed IDs with initial/history messages
  useEffect(() => {
    messages.forEach((m) => processedMessageIdsRef.current.add(m.id));
  }, [messages]);

  useEffect(() => {
    if (!user || !accessToken || isConnected) return;

    // Use a flag to prevent multiple connection attempts
    let isMounted = true;

    // Initialize Socket
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
    ).replace(/\/api\/v1\/?$/, "");
    const socketUrl = `${baseUrl}${namespace}`;

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket"],
      path: "/socket.io/",
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      if (!isMounted) {
        socket.disconnect();
        return;
      }
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      if (isMounted) {
        setIsConnected(false);
      }
    });

    socket.on("newMessage", (message: ChatMessage) => {
      if (!isMounted) return;

      // Deduplication check
      // Check Ref (processed in this session) OR State (loaded from history)
      const alreadyProcessed =
        processedMessageIdsRef.current.has(message.id) ||
        messagesRef.current.some((m) => m.id === message.id);

      // If we have a matching temp ID, it's an optimistic update confirmation
      const isOptimisticConfirmation =
        message.clientTempId &&
        messagesRef.current.some(
          (m) => m.clientTempId === message.clientTempId
        );

      if (alreadyProcessed && !isOptimisticConfirmation) {
        return;
      }

      // Mark as processed
      processedMessageIdsRef.current.add(message.id);

      const isFromAdmin = message.senderType === "ADMIN";
      const isOpen = isChatOpenRef.current;

      // Handle Unread Count & Auto-Read
      let finalIsRead = message.isRead;

      if (!isOptimisticConfirmation && isFromAdmin) {
        if (isOpen) {
          // If chat is open, mark as read immediately on server and locally
          socket.emit("markAsRead", { conversationId: message.conversationId });
          finalIsRead = true;
        } else if (!message.isRead) {
          // Only increment if closed and unread
          setUnreadCount((c) => c + 1);

          // PUSH TO GLOBAL NOTIFICATION STORE
          useNotificationStore.getState().addNotification({
            id: message.id,
            title: "Support Message",
            message: message.content.substring(0, 100),
            type: "CHAT_MESSAGE",
            isRead: false,
            createdAt: message.sentAt,
            link: "/chat?tab=SUPPORT",
          } as any);
        }
      }

      setMessages((prev) => {
        // Handle Optimistic Confirmation replacement
        if (message.clientTempId) {
          const tempIndex = prev.findIndex(
            (m) => m.clientTempId === message.clientTempId
          );
          if (tempIndex !== -1) {
            const newMessages = [...prev];
            newMessages[tempIndex] = {
              ...message,
              isRead: finalIsRead,
              status: "sent",
            };
            return newMessages;
          }
        }

        // Final safety check inside updater (though outer check should catch most)
        if (prev.some((m) => m.id === message.id)) return prev;

        return [...prev, { ...message, isRead: finalIsRead, status: "sent" }];
      });
    });

    socket.on(
      "messageRead",
      (payload: { conversationId: string; userId: string }) => {
        if (!isMounted) return;
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

    socket.on("history", (history: ChatMessage[]) => {
      if (!isMounted) return;
      setMessages(history.map((m) => ({ ...m, status: "sent" })));
    });

    socketRef.current = socket;

    return () => {
      isMounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, accessToken, namespace, isConnected]);

  const sendMessage = useCallback(
    (
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
        conversationId: "temp", // Placeholder for optimistic update
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

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(
          "sendMessage",
          {
            content,
            toUserId,
            clientTempId,
            type,
            metadata,
          },
          (response: any) => {
            if (!response?.success) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.clientTempId === clientTempId
                    ? { ...m, status: "error" }
                    : m
                )
              );
              console.error("Failed to send message:", response?.error);
            }
          }
        );
      }
    },
    [user]
  );

  const markAsRead = useCallback(
    (conversationId?: string) => {
      if (socketRef.current && socketRef.current.connected) {
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
    },
    [] // Stable setUnreadCount and setMessages don't need to be in deps
  );

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
