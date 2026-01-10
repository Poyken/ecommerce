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

/**
 * Trích xuất các hashtags từ một nội dung văn bản.
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const regex = /#[\p{L}\p{N}_]+/gu;
  const matches = text.match(regex);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/**
 * Kiểm tra xem một chuỗi có phải là chuỗi base64 hợp lệ không.
 */
export function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}
