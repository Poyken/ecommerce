import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '@core/logger/logger.service';

/**
 * =====================================================================
 * LOGGING INTERCEPTOR - Giám sát và ghi nhật ký yêu cầu HTTP (P2 Optimized)
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

          // Production Grade Structured Log
          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms`,
            JSON.stringify({
              type: 'access',
              method,
              url,
              statusCode,
              duration,
              userId,
              ip,
              userAgent: userAgent.substring(0, 100),
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`,
            error.stack,
            JSON.stringify({
              type: 'error',
              method,
              url,
              statusCode,
              duration,
              userId,
              ip,
              error: error.message,
            }),
          );
        },
      }),
    );
  }
}
