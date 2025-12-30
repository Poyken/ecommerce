import { useFeatureFlagStore } from "../store/feature-flag.store";

/**
 * =====================================================================
 * USE FEATURE FLAGS - Hook truy cập tính năng
 * =====================================================================
 * 
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * 
 * 1. ABSTRACTION LAYER:
 * - Hook này bọc quanh Zustand store để giữ API giống với Context cũ, giúp việc refactor các component đang dùng `useFeatureFlags` không bị lỗi.
 * 
 * 2. MIGRATION COMPATIBILITY:
 * - `FeatureFlagProvider` hiện tại chỉ là 1 Fragment trống, giúp App cũ vẫn chạy được khi chưa kịp gỡ hết các Provider wrapper.
 * =====================================================================
 */
export function useFeatureFlags() {
  const { enabledFlags, isLoading, isEnabled } = useFeatureFlagStore();
  return { enabledFlags, isLoading, isEnabled };
}

// Re-export provider as Fragment to avoid breaking components during migration
// (Wait, better to just remove it from layout)
export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
