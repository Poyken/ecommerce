import { useEffect, useState } from "react";

/**
 * =====================================================================
 * USE DEBOUNCE HOOK - Hook trì hoãn xử lý
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEBOUNCE LOGIC (Kỹ thuật "chống rung"):
 * - Giới hạn số lần thực thi của một hàm khi sự kiện xảy ra liên tục (như gõ phím).
 * - Ví dụ: User gõ "Samsung", thay vì gọi API cho 7 chữ cái (S, Sa, Sam...), ta đợi user NGỪNG GÕ 500ms mới gọi.
 *
 * 2. MEMORY LEAK PREVENTION (Chống rò rỉ bộ nhớ):
 * - `useEffect` luôn trả về cleanup function `clearTimeout`.
 * - Nếu component unmount HOẶC user gõ phím tiếp (value đổi), timer cũ bị hủy ngay lập tức.
 * - Đảm bảo state `debouncedValue` không bao giờ được set trên một component đã hủy.
 *
 * 3. CLOSURE:
 * - `setTimeout` tạo ra một closure "chụp ảnh" giá trị `value` tại thời điểm đó. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Search Suggestions: Giảm tải số lượng request tìm kiếm khi user gõ liên tục vào ô input.
 * - Window Resize: Tránh tính toán lại layout liên tục khi user thay đổi kích thước cửa sổ trình duyệt.
 * - Form Validation: Chỉ validate email/password sau khi user dừng gõ để tránh gây khó chịu ("Email không hợp lệ" hiện lên khi mới gõ chữ "nguy").

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
