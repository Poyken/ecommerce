import { http } from "@/lib/http";

/**
 * =====================================================================
 * CHAT SERVICE - Domain logic for chat/messaging
 * =====================================================================
 */

interface Conversation {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  updatedAt: string;
}

export const chatService = {
  /**
   * Get recent conversations for admin widget
   */
  getRecentConversations: async (limit = 5) => {
    return http.get<{ data: Conversation[] }>(
      `/chat/conversations?limit=${limit}`,
      {
        skipRedirectOn401: true,
      },
    );
  },

  /**
   * Get products for chat selector
   */
  getProducts: async (search: string, page: number) => {
    return http.get<any>(`/products?search=${search}&page=${page}&limit=20`);
  },

  /**
   * Get orders for chat selector
   */
  getOrders: async (page: number, userId?: string, accessToken?: string) => {
    const url = userId
      ? `/orders?userId=${userId}&page=${page}&limit=20`
      : `/orders/my-orders?page=${page}&limit=20`;

    return http.get<any>(url, {
      ...(accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : {}),
    });
  },

  /**
   * Send message to AI Chatbot
   */
  sendAiMessage: async (message: string, guestId?: string) => {
    return http.post<{
      data: { response: string; sessionId: string };
    }>("/ai-chat/message", { message, guestId });
  },

  /**
   * Get AI Chat history
   */
  getAiHistory: async () => {
    return http.get<{
      data: any[];
    }>("/ai-chat/history");
  },
};
