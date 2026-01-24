import * as crypto from 'crypto';
import { Request } from 'express';

/**
 * =====================================================================
 * FINGERPRINT UTILITY - ĐỊNH DANH THIẾT BỊ NGƯỜI DÙNG
 * =====================================================================
 *
 * =====================================================================
 */
export function getFingerprint(req: Request): string {
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
