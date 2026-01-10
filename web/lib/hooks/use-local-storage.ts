"use client";

import { useCallback, useState } from "react";

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
