/**
 * =====================================================================
 * UTILITY FUNCTIONS - Hàm tiện ích dùng chung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. `cn` (Class Name Utility):
 * - Đây là hàm quan trọng nhất khi làm việc với Tailwind trong React.
 * - Nó kết hợp `clsx` (để xử lý điều kiện: `isTrue && "class"`)
 *   và `tailwind-merge` (để xử lý conflict: `cn("p-4", "p-2")` -> `p-2`).
 * - Không có nó, việc override style từ props sẽ rất lỗi.
 *
 * 2. RE-EXPORTS:
 * - Các hàm format (formatCurrency, formatDate, toSlug) đã được chuyển sang format.ts
 * - Giữ re-export ở đây để backward compatibility
 * =====================================================================
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kết hợp và merge các class names một cách thông minh.
 *
 * Sử dụng clsx để xử lý conditional classes và mảng,
 * sau đó dùng tailwind-merge để xử lý conflicts giữa Tailwind classes.
 *
 * @param inputs - Class names (strings, objects, arrays)
 * @returns String class names đã được merge
 *
 * @example
 * cn("px-2 py-1", "px-4")
 * // → "py-1 px-4" (px-4 override px-2)
 *
 * @example
 * cn("text-red-500", { "text-blue-500": isBlue })
 * // → "text-blue-500" nếu isBlue = true
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// RE-EXPORTS (Backward Compatibility)
// =============================================================================
// Các hàm này đã được chuyển sang format.ts
// Giữ re-export ở đây để code cũ vẫn hoạt động
// Khuyến khích import trực tiếp từ @/lib/format

export { formatVND as formatCurrency, formatDate, toSlug } from "./format";
