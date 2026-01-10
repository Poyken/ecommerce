"use client";

import { useEffect, useRef } from "react";

/**
 * Hook lưu giữ giá trị trước đó của một biến.
 * Hữu ích khi cần so sánh giá trị cũ và mới.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}
