"use client";

import { http } from "@/lib/http";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * =====================================================================
 * FEATURE FLAG SYSTEM - Quản lý bật/tắt tính năng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FEATURE FLAGS PATTERN:
 * - Cho phép bật/tắt tính năng (VD: "New Arrival Badge", "Promo Banner") từ phía server mà không cần deploy lại code frontend.
 * - API `/feature-flags` trả về danh sách các key được enable.
 *
 * 2. CONTEXT API:
 * - Dùng `FeatureFlagProvider` bao bọc toàn bộ App để các component con ở bất kỳ đâu cũng có thể check flag.
 * - `useFeatureFlags()` hook giúp truy cập context dễ dàng.
 *
 * 3. GRACEFUL DEGRADATION:
 * - Nếu API lỗi (`catch`), ta fallback về mảng rỗng `[]` -> Coi như tắt hết tính năng mới, nhưng App vẫn chạy bình thường.
 * =====================================================================
 */

type FeatureFlagContextType = {
  enabledFlags: string[];
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
};

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  enabledFlags: [],
  isLoading: true,
  isEnabled: () => false,
});

export function FeatureFlagProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabledFlags, setEnabledFlags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const response = await http<string[]>("/feature-flags", {
          skipAuth: false,
        });

        // Ensure we always have an array
        // The http helper might return a mock response structure on error
        if (Array.isArray(response)) {
          setEnabledFlags(response);
        } else if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          Array.isArray((response as any).data)
        ) {
          setEnabledFlags((response as any).data);
        } else {
          console.warn("Feature flags response is not an array:", response);
          setEnabledFlags([]);
        }
      } catch (error) {
        console.error("Failed to fetch feature flags:", error);
        setEnabledFlags([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFlags();
  }, []);

  const isEnabled = useCallback(
    (key: string) => enabledFlags.includes(key),
    [enabledFlags]
  );

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({ enabledFlags, isLoading, isEnabled }),
    [enabledFlags, isLoading, isEnabled]
  );

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
