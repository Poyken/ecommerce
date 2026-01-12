/**
 * =====================================================================
 * STRING UTILS - Các hàm tiện ích xử lý chuỗi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KHI NÀO DÙNG?
 * - Bất cứ khi nào bạn cần xử lý chuỗi (String) mà logic đó có thể tái sử dụng.
 * - Ví dụ: Tạo URL thân thiện (slug), kiểm tra base64, lấy hashtag...
 *
 * 2. HÀM NỔI BẬT:
 * - `createSlug`: Biến "Tiếng Việt có dấu" thành "tieng-viet-co-dau" (dùng cho URL sản phẩm).
 *
 * ⚠️ LƯU Ý:
 * - Ưu tiên dùng các thư viện đã được test kỹ (như `slugify`) thay vì tự regex nếu phức tạp.
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
