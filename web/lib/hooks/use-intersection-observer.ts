"use client";

import { useEffect, useState } from "react";

interface IntersectionOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * Hook theo dõi visibility của element (cho lazy load, infinite scroll).
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element | null>,
  options: IntersectionOptions = {}
): IntersectionObserverEntry | undefined {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const node = elementRef?.current;
    if (typeof window === "undefined" || frozen || !node) return;

    const observer = new IntersectionObserver(([entry]) => setEntry(entry), {
      threshold,
      root,
      rootMargin,
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [elementRef, threshold, root, rootMargin, frozen]);

  return entry;
}
