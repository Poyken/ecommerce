/**
 * =====================================================================
 * MASKING HELPER - BẢO VỆ DỮ LIỆU NHẠY CẢM TRONG LOGS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO PHẢI MASKING?
 * - Trong quá trình phát triển, chúng ta thường log lại toàn bộ Request Body để debug.
 * - Tuy nhiên, Body có thể chứa thông tin cực kỳ nhạy cảm: Password, Token, Số thẻ tín dụng...
 * - Nếu log những thứ này ra Console hoặc lưu vào File ròng, chúng ta đang vi phạm bảo mật (Security Breach).
 *
 * 2. CÁCH HOẠT ĐỘNG:
 * - Hàm `maskSensitiveData` nhận vào một Object (JSON).
 * - Nó sẽ duyệt đệ quy qua các key của Object.
 * - Nếu gặp các key nằm trong "Blacklist" (như password, accessToken), nó sẽ thay thế giá trị bằng chuỗi '********'.
 *
 * 3. IMMUTABILITY (Tính bất biến):
 * - Chúng ta luôn clone object gốc trước khi mask để không làm hỏng dữ liệu đang xử lý trong ứng dụng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cung cấp các hàm tiện ích dùng chung, giúp code gọn gàng và tái sử dụng hiệu quả.

 * =====================================================================
 */

const SENSITIVE_KEYS = [
  'password',
  'passwordConfirm',
  'accessToken',
  'refreshToken',
  'token',
  'secret',
  'twoFactorSecret',
  'creditCard',
  'cardNumber',
  'cvv',
  'otp',
  'authorization',
  'cookie',
];

export function maskSensitiveData(data: any): any {
  if (!data) return data;

  // Tránh side-effect: Không chỉnh sửa trực tiếp object gốc
  const clonedData = JSON.parse(JSON.stringify(data));

  const mask = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        mask(obj[key]);
      } else {
        // Kiểm tra xem key có nằm trong danh sách nhạy cảm không (ko phân biệt hoa thường)
        const isSensitive = SENSITIVE_KEYS.some(
          (k) => k.toLowerCase() === key.toLowerCase(),
        );
        if (isSensitive) {
          obj[key] = '********';
        }
      }
    }
  };

  mask(clonedData);
  return clonedData;
}
