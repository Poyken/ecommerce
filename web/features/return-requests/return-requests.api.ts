import {
  ReturnRequest,
  CreateReturnRequestDto,
  UpdateReturnRequestDto,
  ReturnStatus,
} from "./types";

const BASE_URL = "/api/return-requests";

interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: ReturnStatus;
  search?: string;
}

export const returnRequestsApi = {
  /**
   * Get all return requests (Admin)
   */
  findAll: async (options: FindAllOptions = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.status) params.append("status", options.status);
    if (options.search) params.append("search", options.search);

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch return requests");
    return response.json();
  },

  /**
   * Get return requests for current user
   */
  findAllByUser: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`${BASE_URL}/my-returns?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch your return requests");
    return response.json();
  },

  /**
   * Get one return request
   */
  findOne: async (id: string) => {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error("Failed to fetch return request");
    const result = await response.json();
    return result.data;
  },

  /**
   * Create return request
   */
  create: async (data: CreateReturnRequestDto) => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create return request");
    return response.json();
  },

  /**
   * Update return request status (Admin)
   */
  update: async (id: string, data: UpdateReturnRequestDto) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update return request");
    const result = await response.json();
    return result.data;
  },

  /**
   * Approve return request (Admin shortcut)
   */
  approve: async (id: string, notes?: string) => {
    const response = await fetch(`${BASE_URL}/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error("Failed to approve return request");
    const result = await response.json();
    return result.data;
  },

  /**
   * Reject return request (Admin shortcut)
   */
  reject: async (id: string, reason: string) => {
    const response = await fetch(`${BASE_URL}/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to reject return request");
    const result = await response.json();
    return result.data;
  },

  /**
   * Confirm received (Admin shortcut)
   */
  confirmReceived: async (id: string) => {
    const response = await fetch(`${BASE_URL}/${id}/receive`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to confirm received");
    const result = await response.json();
    return result.data;
  },

  /**
   * Process refund (Admin shortcut)
   */
  processRefund: async (id: string, refundAmount?: number) => {
    const response = await fetch(`${BASE_URL}/${id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refundAmount }),
    });
    if (!response.ok) throw new Error("Failed to process refund");
    const result = await response.json();
    return result.data;
  },

  /**
   * Get stats (Admin)
   */
  getStats: async () => {
    const response = await fetch(`${BASE_URL}/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },
};
