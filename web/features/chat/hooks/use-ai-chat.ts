"use client";

import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { chatService } from "../services/chat.service";

/**
 * =====================================================================
 * USE AI CHAT HOOK - Hook quản lý chat AI
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

  const getGuestId = useCallback(() => {
    if (typeof window === "undefined") return undefined;

    let guestId = localStorage.getItem("ai_chat_guest_id");
    if (!guestId) {
      guestId = nanoid();
      localStorage.setItem("ai_chat_guest_id", guestId);
    }
    return guestId;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      const userMessage: AiMessage = {
        id: nanoid(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const guestId = getGuestId();
        const res = await chatService.sendAiMessage(content, guestId);

        if (res.data?.response) {
          const aiMessage: AiMessage = {
            id: nanoid(),
            role: "assistant",
            content: res.data.response,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);

          if (onResponse) {
            onResponse(res.data.response);
          }

          if (res.data.sessionId) {
            setSessionId(res.data.sessionId);
          }
        } else {
          throw new Error("Invalid AI response");
        }
      } catch (err: any) {
        const errorMessage = err?.message || "Failed to send message";
        setError(errorMessage);

        const errorAiMessage: AiMessage = {
          id: nanoid(),
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorAiMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [getGuestId, onResponse],
  );

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await chatService.getAiHistory();
      if (res.data) {
        setMessages(
          res.data.map((m: any) => ({
            id: m.id,
            role: m.role === "USER" ? "user" : "assistant",
            content: m.content,
            createdAt: m.createdAt,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to load AI chat history:", err);
    }
  }, [accessToken]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
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
