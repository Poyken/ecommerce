import * as crypto from 'crypto';

/**
 * =====================================================================
 * FINGERPRINT UTILITY - ĐỊNH DANH THIẾT BỊ NGƯỜI DÙNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO CẦN FINGERPRINT?
 * - Nếu hacker ăn trộm được `accessToken` của bạn, họ có thể giả mạo bạn.
 * - Fingerprint giúp ngăn chặn điều này bằng cách gắn chặt Token với thiết bị cụ thể (dựa trên IP và User-Agent).
 * - Nếu Token bị dùng ở một thiết bị có IP/UA khác -> Hệ thống sẽ từ chối.
 *
 * 2. SHA-256 HASHING:
 * - Ta không lưu trực tiếp thông tin thô mà băm (Hash) nó thành một chuỗi ký tự duy nhất để bảo mật thông tin người dùng.
 * =====================================================================
 */
export function getFingerprint(req: any): string {
  const ua = req.headers['user-agent'] || '';

  // Lấy IP từ X-Forwarded-For (do Next.js server forward tới) hoặc fallback về req.ip
  const xForwardedFor = req.headers['x-forwarded-for'];
  let ip = '';

  if (xForwardedFor) {
    // X-Forwarded-For có thể là một chuỗi cac IP cách nhau bởi dấu phẩy
    ip =
      typeof xForwardedFor === 'string'
        ? xForwardedFor.split(',')[0].trim()
        : xForwardedFor[0];
  } else {
    ip = req.ip || (req.connection && req.connection.remoteAddress) || '';
  }

  return crypto
    .createHash('sha256')
    .update(ip + ua)
    .digest('hex');
}
