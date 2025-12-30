import { http } from "@/lib/http";
/**
 * =====================================================================
 * FEATURE FLAG STORE - Quản lý tính năng động
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC CONFIGURATION:
 * - Cho phép bật/tắt các tính năng (VD: "Black Friday Sale", "New AI Chat") từ xa mà không cần deploy lại code.
 * - Store lưu trữ danh sách các flag đang được kích hoạt (`enabledFlags`).
 *
 * 2. GLOBAL ACCESSIBILITY:
 * - Thay thế Provider cũ bằng Zustand để bất kỳ component nào cũng có thể check flag nhanh chóng (`isEnabled`).
 *
 * 3. ERROR RESILIENCE:
 * - Nếu fetch flag lỗi, store sẽ mặc định trả về mảng rỗng (tắt tính năng lạ) để App không bị crash.
 * =====================================================================
 */

import { create } from "zustand";

interface FeatureFlagState {
  enabledFlags: string[];
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
  setFlags: (flags: string[]) => void;
  fetchFlags: () => Promise<void>;
}

export const useFeatureFlagStore = create<FeatureFlagState>((set, get) => ({
  enabledFlags: [],
  isLoading: true,
  isEnabled: (key: string) => get().enabledFlags.includes(key),
  setFlags: (flags) => set({ enabledFlags: flags, isLoading: false }),
  fetchFlags: async () => {
    set({ isLoading: true });
    try {
      const response = await http<string[]>("/feature-flags/my-flags", {
        skipAuth: true,
      });

      let flags: string[] = [];
      if (Array.isArray(response)) {
        flags = response;
      } else if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as any).data)
      ) {
        flags = (response as any).data;
      }

      set({ enabledFlags: flags, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
      set({ enabledFlags: [], isLoading: false });
    }
  },
}));
