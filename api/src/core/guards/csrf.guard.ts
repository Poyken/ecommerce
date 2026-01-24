import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * =====================================================================
 * CSRF GUARD - Bảo vệ chống tấn công giả mạo (Cross-Site Request Forgery)
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  // Whitelist: Routes that don't need CSRF protection
  private readonly publicRoutes = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/google',
    '/api/v1/auth/google/callback',
    '/api/v1/auth/facebook',
    '/api/v1/auth/facebook/callback',
    '/api/v1/webhooks', // General webhooks
    '/api/v1/payment/momo_ipn', // MoMo IPN
    '/api/v1/shipping/webhook', // GHN Webhook
    '/api/v1/health',
    '/api/v1/notifications',
    '/api/v1/ai-chat', // AI Chat (guest + logged-in)
    '/api/v1/analytics/vitals', // Vercel Analytics
  ];

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() === 'ws') {
      return true; // Skip CSRF check for WebSockets
    }
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Chỉ kiểm tra các phương thức làm thay đổi dữ liệu (State-changing)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // 2. Whitelist public routes (login, register, webhooks)
    const path = request.url || request.path || '';
    if (this.publicRoutes.some((route) => path.startsWith(route))) {
      return true;
    }

    // 3. Chế độ phát triển (Optional: disable nếu cần debug dễ dàng)
    // UNCOMMENT line below to disable CSRF in development
    if (process.env.NODE_ENV !== 'production') return true;

    // 4. Trích xuất token từ Header và Cookie
    const csrfHeader = request.headers['x-csrf-token'];
    const csrfCookie = request.cookies['csrf-token'];

    if (!csrfHeader) {
      throw new ForbiddenException('CSRF Token missing in header');
    }

    if (!csrfCookie) {
      throw new ForbiddenException('CSRF Token missing in cookie');
    }

    // 5. So sánh (Double Submit Cookie validation)
    if (csrfHeader !== csrfCookie) {
      throw new ForbiddenException('CSRF Token mismatch');
    }

    return true;
  }
}
