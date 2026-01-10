"use client";

import { useCallback, useState } from "react";

/**
 * Hook copy text vào clipboard.
 */
export function useCopyToClipboard(): [
  string | null,
  (text: string) => Promise<boolean>
] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator?.clipboard) {
      console.warn("Clipboard API not available");
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn("Copy failed:", error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return [copiedText, copy];
}
