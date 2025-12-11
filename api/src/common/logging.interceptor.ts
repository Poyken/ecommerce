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
 * LoggingInterceptor - Ghi log tất cả các yêu cầu HTTP
 * Ghi log tất cả requests với thông tin:
 * - Method, URL, Status Code
 * - Thời gian phản hồi
 * - Thông tin người dùng (nếu đã xác thực)
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
