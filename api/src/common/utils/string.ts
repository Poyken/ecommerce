/**
 * =====================================================================
 * STRING UTILS - Các hàm tiện ích xử lý chuỗi
 * =====================================================================
 *
 * =====================================================================
 */
import slugify from 'slugify';

/**
 * =====================================================================
 * STRING UTILS - Tiện ích xử lý chuỗi
 * =====================================================================
 */

/**
 * Tạo slug từ một chuỗi (Vd: "Tên Sản Phẩm" -> "ten-san-pham")
 *
 * @param text - Chuỗi cần tạo slug
 * @returns Chuỗi đã được slugify
 */
export function createSlug(text: string): string {
  if (!text) return '';

  return slugify(text, {
    lower: true, // Chuyển thành chữ thường
    strict: true, // Loại bỏ các ký tự đặc biệt trừ dấu gạch ngang
    locale: 'vi', // Hỗ trợ tiếng Việt tốt hơn
    trim: true, // Loại bỏ khoảng trắng 2 đầu
  });
}
