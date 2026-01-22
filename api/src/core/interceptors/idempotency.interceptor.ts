import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '@core/redis/redis.service';

/**
 * =====================================================================
 * IDEMPOTENCY INTERCEPTOR - CHỐNG TRÙNG LẶP REQUEST (RETRY SAFETY)
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly IDEMPOTENCY_PREFIX = 'idempotency:';
  private readonly CACHE_TTL = 86400; // 24 giờ (Dư dả thời gian cho retry)

  constructor(private readonly redis: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 1. Chỉ áp dụng cho POST và PATCH (là những phương thức cần bảo vệ nhất)
    if (!['POST', 'PATCH'].includes(request.method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['x-idempotency-key'];

    // Nếu client không gửi key, ta cho qua bình thường (hoặc có thể bắt lỗi tùy business)
    if (!idempotencyKey) {
      return next.handle();
    }

    const userId = request.user?.id || 'guest';
    const cacheKey = `${this.IDEMPOTENCY_PREFIX}${userId}:${idempotencyKey}`;

    // 2. Kiểm tra xem Key này đã được xử lý chưa
    const cachedResponse = await this.redis.get(cacheKey);
    if (cachedResponse) {
      const { status, body } = JSON.parse(cachedResponse);

      // Trả lại kết quả cũ kèm header đánh dấu
      response.status(status);
      response.header('X-Idempotency-Hit', 'true');
      return of(body);
    }

    // 3. Nếu chưa xử lý, tiến hành xử lý và lưu lại kết quả
    return next.handle().pipe(
      tap((body) => {
        const statusCode = response.statusCode;
        // Fire-and-forget cache setting (don't block response)
        void this.cacheResponse(statusCode, cacheKey, body);
      }),
    );
  }

  private async cacheResponse(statusCode: number, key: string, body: any) {
    try {
      // Chỉ lưu cache cho các response thành công (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        const cacheData = JSON.stringify({
          status: statusCode,
          body: body,
        });

        await this.redis.client.set(key, cacheData, 'EX', this.CACHE_TTL);
      }
    } catch (error) {
      // Silently fail for cache errors to not disrupt main flow
      // console.error('Idempotency cache failed', error);
    }
  }
}
