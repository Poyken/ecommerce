/**
 * =====================================================================
 * CUSTOM HOOKS - React Hooks tái sử dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CUSTOM HOOKS:
 * - Là cách để đóng gói logic React có thể tái sử dụng.
 * - Thay vì copy-paste logic ở nhiều nơi, ta viết hook một lần và import.
 *
 * 2. NAMING CONVENTION:
 * - Tất cả hooks phải bắt đầu bằng "use" (VD: useDebounce, useLocalStorage).
 * - React dựa vào prefix này để biết đây là hook và áp dụng các rules.
 * =====================================================================
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================================
// useDebounce - Debounce giá trị
// ============================================================================

/**
 * Hook debounce giá trị. Trả về giá trị sau khi ngừng thay đổi một khoảng thời gian.
 *
 * @param value - Giá trị cần debounce
 * @param delay - Thời gian delay (ms)
 * @returns Giá trị đã được debounce
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * // debouncedSearch chỉ cập nhật sau khi ngừng gõ 300ms
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// useLocalStorage - Đồng bộ state với localStorage
// ============================================================================

/**
 * Hook quản lý state đồng bộ với localStorage.
 * Tự động lưu/đọc từ localStorage khi state thay đổi.
 *
 * @param key - Key trong localStorage
 * @param initialValue - Giá trị khởi tạo nếu chưa có trong storage
 * @returns [value, setValue] giống như useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // State để lưu giá trị hiện tại
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Hàm cập nhật value (tương thích với callback pattern)
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Hỗ trợ cả value trực tiếp và callback function
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================================================
// useMediaQuery - Responsive breakpoint detection
// ============================================================================

/**
 * Hook kiểm tra media query.
 *
 * @param query - Media query string (VD: "(min-width: 768px)")
 * @returns true nếu query match
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Hook tiện lợi cho các breakpoint phổ biến.
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");

  return { isMobile, isTablet, isDesktop, isLargeDesktop };
}

// ============================================================================
// useOnClickOutside - Detect click outside element
// ============================================================================

/**
 * Hook phát hiện click bên ngoài element.
 * Thường dùng cho dropdown, modal, popup.
 *
 * @param ref - Ref của element cần theo dõi
 * @param handler - Callback khi click outside
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ============================================================================
// usePrevious - Lấy giá trị trước đó của state
// ============================================================================

/**
 * Hook lưu giữ giá trị trước đó của một biến.
 * Hữu ích khi cần so sánh giá trị cũ và mới.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// useToggle - Boolean toggle
// ============================================================================

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

// ============================================================================
// useAsync - Quản lý async operation state
// ============================================================================

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook quản lý state của async operation.
 * Tự động track loading, error, data.
 *
 * @param asyncFunction - Hàm async cần thực thi
 * @param immediate - Có chạy ngay khi mount không
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return { ...state, execute };
}

// ============================================================================
// useIntersectionObserver - Lazy loading / Infinite scroll
// ============================================================================

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
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !node) return;

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

// ============================================================================
// useCopyToClipboard - Copy text to clipboard
// ============================================================================

/**
 * Hook copy text vào clipboard.
 */
export function useCopyToClipboard(): [
  string | null,
  (text: string) => Promise<boolean>
] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
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

// ============================================================================
// useEventListener - Attach event listener safely
// ============================================================================

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
    const targetElement = element ?? window;
    if (!targetElement?.addEventListener) return;

    const listener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    targetElement.addEventListener(eventName, listener);

    return () => {
      targetElement.removeEventListener(eventName, listener);
    };
  }, [eventName, element]);
}

// ============================================================================
// useScrollLock - Lock body scroll (for modals)
// ============================================================================

/**
 * Hook lock scroll của body (dùng khi mở modal).
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [lock]);
}

// ============================================================================
// useKeyPress - Detect specific key press
// ============================================================================

/**
 * Hook phát hiện phím bấm.
 */
export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}
