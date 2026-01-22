import { LoggerService } from '@core/logger/logger.service';
import { maskSensitiveData } from '@/common/utils/masking';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '@core/metrics/metrics.service';

/**
 * =====================================================================
 * LOGGING INTERCEPTOR - GIÁM SÁT HIỆU NĂNG & NHẬT KÝ REQUEST
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

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

          // [METRICS OPTIMIZATION] Track business performance
          this.metrics.incrementCounter(`api_requests_total`);
          this.metrics.incrementCounter(`api_requests_status_${statusCode}`);
          this.metrics.recordHistogram(`api_request_duration_ms`, duration);

          const correlationId = request.correlationId || 'unknown';

          // Production Grade Structured Log with Correlation ID
          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms [${correlationId}]`,
            JSON.stringify({
              type: 'access',
              correlationId,
              method,
              url,
              statusCode,
              duration,
              userId,
              ip,
              userAgent: userAgent.substring(0, 100),
              body: maskSensitiveData(request.body),
            }),
          );

          // Alert for slow requests
          if (duration > 500) {
            this.logger.warn(
              `🐢 Slow Request detected: ${method} ${url} took ${duration}ms`,
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          const correlationId = request.correlationId || 'unknown';

          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms [${correlationId}] - ${error.message}`,
            error.stack,
            JSON.stringify({
              type: 'error',
              correlationId,
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
