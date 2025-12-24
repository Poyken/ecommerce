"use client";

import { http } from "@/lib/http";
import { createContext, useContext, useEffect, useState } from "react";

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
