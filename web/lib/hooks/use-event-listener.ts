"use client";

import { useEffect, useRef } from "react";

/**
 * Hook đính kèm event listener an toàn (tự cleanup).
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | HTMLElement | null
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement =
      element ?? (typeof window !== "undefined" ? window : null);
    if (!targetElement?.addEventListener) return;

    const listener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    targetElement.addEventListener(eventName, listener);

    return () => {
      targetElement.removeEventListener(eventName, listener);
    };
  }, [eventName, element]);
}
