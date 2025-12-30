import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * =====================================================================
 * CUSTOM THROTTLER GUARD - KIỂM SOÁT TẦN SUẤT GỌI API (RATE LIMITING)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RATE LIMITING (Giới hạn tốc độ):
 * - Dùng để ngăn chặn bot hoặc kẻ tấn công spam API liên tục (Brute-force/DDoS).
 *
 * 2. TRACKER (Định danh):
 * - Hệ thống sẽ theo dõi lượt gọi API dựa trên `userId` (nếu đã đăng nhập) hoặc `IP Address` (nếu là khách).
 *
 * 3. DYNAMIC LIMITS (Giới hạn linh hoạt):
 * - Người dùng đã đăng nhập (`request.user`) được ưu tiên hơn (100 lượt/phút).
 * - Khách vãng lai (`guest`) bị giới hạn khắt khe hơn (20 lượt/phút) để tránh bot đào dữ liệu.
 * =====================================================================
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: any): Promise<string> {
    return Promise.resolve(req.user?.id || req.ip);
  }

  protected getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    return Promise.resolve(request.user ? 100 : 20);
  }

  protected getTimeToLive(): Promise<number> {
    return Promise.resolve(60);
  }
}
