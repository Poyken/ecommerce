"use client";

import { useEffect } from "react";

/**
 * Hook lock scroll của body (dùng khi mở modal).
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (typeof window === "undefined" || !lock) return;

    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [lock]);
}
