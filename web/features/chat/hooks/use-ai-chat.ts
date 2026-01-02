"use client";

import { nanoid } from "nanoid";
import { useCallback, useState } from "react";

/**
 * =====================================================================
 * USE AI CHAT HOOK - Hook quản lý chat AI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GUEST SESSION:
 * - Sử dụng guestId lưu trong localStorage để track session.
 * - Nếu user chưa có guestId, tạo mới bằng nanoid.
 *
 * 2. STATE MANAGEMENT:
 * - messages: Danh sách tin nhắn (cả user và AI)
 * - isLoading: Đang chờ response từ AI
 * - error: Lỗi nếu có
 *
 * 3. API INTEGRATION:
 * - Gọi API /ai-chat/message với message và guestId
 * - Nếu user đã login, API sẽ dùng userId từ token
 * =====================================================================
 */

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface UseAiChatOptions {
  accessToken?: string;
  onResponse?: (message: string) => void;
}

export function useAiChat({ accessToken, onResponse }: UseAiChatOptions = {}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Get or create guestId from localStorage
  // Get or create guestId from localStorage
  const getGuestId = useCallback(() => {
    // ALWAYS return guestId (as a fallback in case token is invalid/expired)
    // if (accessToken) return undefined; <-- REMOVED

    if (typeof window === "undefined") return undefined;

    let guestId = localStorage.getItem("ai_chat_guest_id");
    if (!guestId) {
      guestId = nanoid();
      localStorage.setItem("ai_chat_guest_id", guestId);
    }
    return guestId;
  }, []); // Removed accessToken dependency

  // Send message to AI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately (optimistic)
      const userMessage: AiMessage = {
        id: nanoid(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const guestId = getGuestId();
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${apiUrl}/ai-chat/message`, {
          method: "POST",
          headers,
          credentials: "include", // Important: Send cookies with request
          body: JSON.stringify({ message: content, guestId }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

        const data = await response.json();

        if (data.data?.response) {
          const aiMessage: AiMessage = {
            id: nanoid(),
            role: "assistant",
            content: data.data.response,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Trigger callback for the widget to handle unread counts/titles
          if (onResponse) {
            onResponse(data.data.response);
          }

          if (data.data.sessionId) {
            setSessionId(data.data.sessionId);
          }
        } else {
          throw new Error(data.message || "Unknown error");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);

        // Add error message from AI
        const errorAiMessage: AiMessage = {
          id: nanoid(),
          role: "assistant",
          content:
            "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hotline để được hỗ trợ.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorAiMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, getGuestId]
  );

  // Load chat history (only for logged-in users)
  const loadHistory = useCallback(async () => {
    if (!accessToken) return;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

      const response = await fetch(`${apiUrl}/ai-chat/history`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include", // Important: Send cookies with request
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setMessages(
            data.data.map(
              (m: {
                id: string;
                role: string;
                content: string;
                createdAt: string;
              }) => ({
                id: m.id,
                role: m.role === "USER" ? "user" : "assistant",
                content: m.content,
                createdAt: m.createdAt,
              })
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to load AI chat history:", err);
    }
  }, [accessToken]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    // Don't clear guestId, keep session continuity
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    loadHistory,
    clearChat,
  };
}
