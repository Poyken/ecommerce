import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const user = request.user;

    // Chỉ log các phương thức thay đổi dữ liệu (POST, PUT, PATCH, DELETE)
    // Và chỉ log cho các route /api/admin hoặc các route quản trị quan trọng
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isAdminRoute =
      url.includes('/admin') ||
      url.includes('/users') ||
      url.includes('/roles') ||
      url.includes('/products') ||
      url.includes('/blogs') ||
      url.includes('/brands') ||
      url.includes('/categories') ||
      url.includes('/coupons') ||
      url.includes('/reviews') ||
      url.includes('/orders') ||
      url.includes('/skus') ||
      url.includes('/permissions');

    return next.handle().pipe(
      tap({
        next: (data) => {
          const user = request.user;
          if (isMutation && isAdminRoute) {
            // Tách resource từ URL (ví dụ: /api/v1/users/123 -> users)
            const parts = url
              .split('/')
              .filter((p) => p && !['api', 'v1'].includes(p));
            const resource = parts[0] || 'unknown';
            const action = `${method.toLowerCase()}_${resource}`;

            this.auditService.create({
              userId: user?.id,
              action,
              resource,
              payload: {
                body: request.body,
                params: request.params,
                query: request.query,
                // response: data // Có thể log cả response nếu cần
              },
              ipAddress: ip,
              userAgent,
            });
          }
        },
      }),
    );
  }
}
