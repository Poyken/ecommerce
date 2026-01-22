import { featureFlagService } from "../services/admin-feature-flag.service";


import { create } from "zustand";

export interface FeatureFlagState {
  enabledFlags: string[];
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
  setFlags: (flags: string[]) => void;
  fetchFlags: () => Promise<void>;
}

export const useFeatureFlagStore = create<FeatureFlagState>()((set, get) => ({
  enabledFlags: [],
  isLoading: true,
  isEnabled: (key: string) => get().enabledFlags.includes(key),
  setFlags: (flags: string[]) => set({ enabledFlags: flags, isLoading: false }),
  fetchFlags: async () => {
    set({ isLoading: true });
    try {
      const response = await featureFlagService.getMyFlags();

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
