import { useFeatureFlagStore } from "../store/feature-flag.store";


export function useFeatureFlags() {
  const { enabledFlags, isLoading, isEnabled } = useFeatureFlagStore();
  return { enabledFlags, isLoading, isEnabled };
}

// Re-export provider as Fragment to avoid breaking components during migration
// (Wait, better to just remove it from layout)
export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
