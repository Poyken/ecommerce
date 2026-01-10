"use client";

import { useMemo, useState } from "react";

/**
 * Hook quản lý boolean state với các methods tiện lợi.
 */
export function useToggle(
  initialValue = false
): [
  boolean,
  { toggle: () => void; setTrue: () => void; setFalse: () => void }
] {
  const [value, setValue] = useState(initialValue);

  const handlers = useMemo(
    () => ({
      toggle: () => setValue((v) => !v),
      setTrue: () => setValue(true),
      setFalse: () => setValue(false),
    }),
    []
  );

  return [value, handlers];
}
