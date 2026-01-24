

"use client";

import { useEffect } from "react";
import {
  FeatureFlagState,
  useFeatureFlagStore,
} from "@/features/admin/store/feature-flag.store";

export function FeatureFlagInitializer() {
  const fetchFlags = useFeatureFlagStore(
    (state: FeatureFlagState) => state.fetchFlags
  );

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return null;
}
