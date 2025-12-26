import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  /**
   * =====================================================================
   * APP THROTTLER GUARD - Bảo vệ tài nguyên (Rate Limiting)
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. RATE LIMITING LOGIC:
   * - Guard này kế thừa từ `ThrottlerGuard` chuẩn của NestJS.
   * - Nhiệm vụ: Chặn các request quá nhanh từ cùng 1 IP (DDoS protection).
   *
   * 2. CUSTOM LOGIC:
   * - Guest (Chưa đăng nhập): Giới hạn 1000 requests/phút.
   * - User (Đã đăng nhập): Giới hạn 2000 requests/phút (Cao hơn vì tin tưởng hơn).
   *
   * 3. WHY HIGH LIMIT?
   * - Next.js khi build (SSG - Static Site Generation) sẽ bắn hàng nghìn request cùng lúc để lấy dữ liệu build trang.
   * - Nếu để limit thấp (vd: 20 req/phút), quá trình build sẽ bị lỗi 429 Too Many Requests.
   * =====================================================================
   */

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;

    const req = context.switchToHttp().getRequest();
    const isUser = !!req.user;

    // Custom Limit Logic: Scaled up to support static site generation (SSG)
    // P0 Optimization: Increased from 100/20 to 1000 to prevent build failures.
    const effectiveLimit = isUser ? 2000 : 1000;

    return super.handleRequest({
      ...requestProps,
      limit: effectiveLimit,
    });
  }
}
