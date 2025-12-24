"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { http } from "@/lib/http";

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
        const flags = await http<string[]>("/feature-flags", {
          skipAuth: false,
        });
        setEnabledFlags(flags || []);
      } catch (error) {
        console.error("Failed to fetch feature flags:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFlags();
  }, []);

  const isEnabled = (key: string) => enabledFlags.includes(key);

  return (
    <FeatureFlagContext.Provider value={{ enabledFlags, isLoading, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
