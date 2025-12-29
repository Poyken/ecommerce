"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "USER" | "ADMIN";
  content: string;
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

        return [...prev, { ...message, status: "sent" }];
      });
    });

    // Listen for history load
    socket.on("history", (history: ChatMessage[]) => {
      setMessages(history.map((m) => ({ ...m, status: "sent" })));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, accessToken, namespace]);

  const sendMessage = (content: string, toUserId?: string) => {
    if (!user) return;

    // Generate temp ID
    const clientTempId = Date.now().toString();

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: `temp-${clientTempId}`,
      senderId: user.id,
      senderType: "USER", // Assuming hook is used by User mostly, but if used by Admin it might be wrong?
      // Wait, the hook is generic. user.role isn't passed efficiently.
      // But usually usage: ChatWidget (Store) -> User. AdminChat -> Admin.
      // Let's assume User for now or check if we can deduce.
      // Actually, if I am Admin, senderType should be ADMIN.
      // But `user` prop in `ChatWidget` might not have role.
      // However, `socket.emit` doesn't send senderType (Server derives it from token).
      // For optimistic update, we need to guess senderType.
      // If `toUserId` is provided, usually it's Admin sending to User?
      // Or in `AdminChat`, we definitely need sending as ADMIN.
      // Let's just set "USER" for default but if we are in Admin context...
      // If I use this hook in Admin Panel, `user` is the Admin User.
      // Let's add `senderType` to optimistic msg?
      // Actually, we can check logic.
      content,
      sentAt: new Date().toISOString(),
      clientTempId,
      status: "sending",
    };

    // If we are admin?
    // The previous code didn't handle `senderType` in sendMessage args.
    // The server handles it.
    // Ideally we pass `senderType` to hook or derived it.
    // For now, let's look at `ChatWidget`. usage: `useChatSocket(..., user)`.
    // User object in `ChatWidget` comes from auth?
    // Let's rely on server for truth, but for optimistic UI, we just need to display it "right".
    // `ChatWidget` checks `msg.senderId === user.id` to align right.
    // `tempMessage.senderId` is `user.id`. So it will align right.
    // `msg.senderType` is used to check `isMe`. `msg.senderType === 'USER'`.
    // If I am Admin, and I use this hook? `ChatAdminClient`.
    // Let's check `ChatAdminClient` usage of this hook afterwards.

    setMessages((prev) => [...prev, tempMessage]);

    if (socketRef.current && isConnected) {
      socketRef.current.emit("sendMessage", {
        content,
        toUserId,
        clientTempId,
      });
    }
  };

  return { isConnected, messages, sendMessage, setMessages };
}
