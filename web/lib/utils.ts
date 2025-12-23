/**
 * =====================================================================
 * UTILITY FUNCTIONS - Hàm tiện ích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. `cn` (Class Name) UTILITY:
 * - Đây là hàm quan trọng nhất khi làm việc với Tailwind CSS trong React.
 * - Kết hợp sức mạnh của `clsx` (xử lý logic điều kiện) và `tailwind-merge` (xử lý xung đột class).
 *
 * 2. VẤN ĐỀ GIẢI QUYẾT:
 * - Nếu chỉ dùng string template: `className="p-4 ${className}"` -> Có thể sinh ra `p-4 p-2` (CSS nào thắng tùy thuộc thứ tự define, rất khó debug).
 * - Dùng `cn`: `cn("p-4", "p-2")` -> `p-2` (Class sau ghi đè class trước một cách logic).
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

/**
 * Chuyển đổi chuỗi thành slug URL-friendly.
 * Hỗ trợ tiếng Việt và các ký tự đặc biệt.
 *
 * @param str - Chuỗi cần chuyển đổi
 * @returns Slug string (vd: "San Pham Moi" -> "san-pham-moi")
 */
export function toSlug(str: string): string {
  return str
    .normalize("NFD") // Tách các ký tự có dấu (vd: é -> e + sắc)
    .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase() // Chuyển về chữ thường
    .replace(/[^a-z0-9 ]/g, "") // Xóa ký tự đặc biệt (chỉ giữ chữ, số, dấu cách)
    .replace(/\s+/g, "-") // Thay dấu cách bằng dấu gạch ngang
    .replace(/^-+|-+$/g, ""); // Xóa gạch ngang ở đầu/cuối
}

/**
 * Định dạng số thành tiền tệ Việt Nam (VND).
 *
 * @param amount - Số tiền cần định dạng
 * @returns Chuỗi đã định dạng (vd: 100.000 ₫)
 */
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    ...options,
  }).format(amount);
}

/**
 * Định dạng ngày tháng theo chuẩn Việt Nam.
 *
 * @param date - Date object hoặc chuỗi ngày
 * @param options - Tùy chọn định dạng
 * @returns Chuỗi ngày đã định dạng (vd: 01/01/2024)
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = new Date(date);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(d);
}
