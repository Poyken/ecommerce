/**
 * =====================================================================
 * SUPER-ADMIN-IP.GUARD.TS
 * =====================================================================
 *
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
    if (!user || !user.permissions?.includes('super-admin:read')) {
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
