import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { maskSensitiveData } from '@/common/utils/masking';

/**
 * =====================================================================
 * AUDIT INTERCEPTOR - TỰ ĐỘNG GHI NHẬT KÝ TÁC ĐỘNG DỮ LIỆU
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INTERCEPTOR (Bộ đánh chặn):
 * - Interceptor cho phép ta "nhảy vào" giữa quá trình xử lý request.
 * - Ở đây ta dùng nó để tự động hóa việc ghi log mà không cần viết code log ở từng Controller.
 *
 * 2. MUTATION FILTERING:
 * - Ta chỉ quan tâm đến các hành động làm thay đổi dữ liệu (POST, PUT, PATCH, DELETE).
 * - Các hành động xem dữ liệu (GET) thường được bỏ qua để tránh làm rác log.
 *
 * 3. RESOURCE EXTRACTION:
 * - Logic trong hàm `intercept` tự động bóc tách URL để biết User đang tương tác với tài nguyên nào (Sản phẩm, Đơn hàng, Người dùng...) và lưu lại kèm theo Body của request. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
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
      url.includes('/super-admin') ||
      url.includes('/tenants') ||
      url.includes('/plans') ||
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
      url.includes('/permissions') ||
      url.includes('/invoices') ||
      url.includes('/settings') ||
      url.includes('/promotions') ||
      url.includes('/rma') ||
      url.includes('/inventory') ||
      url.includes('/media') ||
      url.includes('/customer-groups') ||
      url.includes('/notifications') ||
      url.includes('/feature-flags') ||
      url.includes('/pages');

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
                body: maskSensitiveData(request.body),
                params: request.params,
                query: request.query,
                response: maskSensitiveData(data), // Masking response too
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
