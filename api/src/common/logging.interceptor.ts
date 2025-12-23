import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

/**
 * =====================================================================
 * LOGGING INTERCEPTOR - Giám sát và ghi nhật ký yêu cầu HTTP
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INTERCEPTOR PATTERN:
 * - Interceptor cho phép ta "chặn" yêu cầu trước khi nó đến Controller và sau khi nó rời khỏi Controller.
 * - Rất hữu ích để xử lý các tác vụ xuyên suốt (Cross-cutting concerns) như Logging, Transform dữ liệu.
 *
 * 2. OBSERVABLES (RxJS):
 * - `next.handle()` trả về một Observable. Ta dùng toán tử `tap` để thực hiện hành động phụ (ghi log) mà không làm thay đổi dữ liệu trả về.
 *
 * 3. PERFORMANCE MONITORING:
 * - Bằng cách tính toán `startTime` và `Date.now()`, ta biết được chính xác mỗi API mất bao lâu để xử lý.
 * - Giúp phát hiện các "nút thắt cổ chai" (Bottlenecks) trong hệ thống.
 *
 * 4. DEBUGGING INFORMATION:
 * - Ghi lại Method, URL, Status Code, IP và User Agent để phục vụ việc điều tra lỗi hoặc phân tích hành vi người dùng.
 * =====================================================================
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.id || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms`,
            'HTTP',
          );

          // Log debug chi tiết
          this.logger.debug(
            JSON.stringify({
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              userId,
              ip,
              userAgent: userAgent.substring(0, 50),
            }),
            'HTTP',
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ${error.status || 500} - ${duration}ms - ${error.message}`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}
