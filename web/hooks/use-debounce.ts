import { useEffect, useState } from "react";

/**
 * =====================================================================
 * USE DEBOUNCE HOOK - Hook trì hoãn xử lý
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEBOUNCE LOGIC:
 * - Kỹ thuật giới hạn số lần gọi hàm trong một khoảng thời gian.
 * - Chỉ update giá trị `debouncedValue` sau khi user "ngừng" thay đổi `value` trong `delay` ms.
 *
 * 2. MEMORY LEAK PREVENTION:
 * - `useEffect` trả về một cleanup function (`clearTimeout`).
 * - Nếu `value` thay đổi trước khi hết thời gian `delay`, timeout cũ sẽ bị hủy.
 * - Đảm bảo không có update state nào chạy sau khi component đã unmount hoặc value đã đổi.
 *
 * 3. CLOSURE:
 * - `setTimeout` tạo ra một closure lưu giữ giá trị `value` tại thời điểm nó được gọi.
 * =====================================================================
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function - clears timeout if value changes before delay completes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]); // Only re-run if value or delay changes

  return debouncedValue;
}
