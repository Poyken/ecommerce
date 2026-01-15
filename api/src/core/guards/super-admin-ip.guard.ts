/**
 * =====================================================================
 * SUPER-ADMIN-IP.GUARD.TS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * [Mô tả ngắn gọn mục đích của file]
 *
 * 1. CHỨC NĂNG:
 *    - [Mô tả các chức năng chính]
 *
 * 2. CÁCH SỬ DỤNG:
 *    - [Hướng dẫn sử dụng] *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Zero Trust Security: Không tin ai cả, ngay cả khi đã có password admin -> Cần đúng IP công ty mới vào được.
 * - Compliance: Đáp ứng các yêu cầu bảo mật khắt khe (ISO 27001, PCI DSS) về việc giới hạn truy cập vùng Admin.
 * - VPN Integration: Buộc admin phải dùng VPN công ty mới có thể truy cập hệ thống quản trị.

 * =====================================================================
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SuperAdminIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    // 1. Chỉ áp dụng cho PLATFORM ADMIN
    if (!user || !user.permissions?.includes('superAdmin:read')) {
      return true;
    }

    // 2. Lấy IP của Client (Hỗ trợ Proxy/Load Balancer)
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip ||
      request.socket.remoteAddress;

    // 3. Bypass cho Local Development
    if (
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === '::ffff:127.0.0.1' ||
      !clientIp // Safety fallback
    ) {
      return true;
    }

    // 4. Kiểm tra Whitelist
    const whitelistedIps = user.whitelistedIps || [];

    // Nếu chưa cấu hình whitelist thì cho phép (Tránh lockout ngay lập tức)
    // Hoặc nếu IP hiện tại nằm trong whitelist
    if (whitelistedIps.length === 0 || whitelistedIps.includes(clientIp)) {
      return true;
    }

    // 5. Từ chối truy cập
    throw new ForbiddenException({
      statusCode: 403,
      message: `Your IP (${clientIp}) is not whitelisted for Super Admin access.`,
      error: 'Forbidden',
    });
  }
}
