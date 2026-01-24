/**
 * =====================================================================
 * MASKING HELPER - BẢO VỆ DỮ LIỆU NHẠY CẢM TRONG LOGS
 * =====================================================================
 *
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
