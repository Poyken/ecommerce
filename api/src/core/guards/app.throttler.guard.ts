import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { getTenant } from '../tenant/tenant.context';
import { TenantPlan } from '@prisma/client';

/**
 * PLAN-BASED LIMITS
 * Limits are per minute (matching the 60s TTL in AppModule)
 */
const PLAN_LIMITS = {
  [TenantPlan.BASIC]: 500,
  [TenantPlan.PRO]: 2000,
  [TenantPlan.ENTERPRISE]: 5000,
};

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  /**
   * =====================================================================
   * APP THROTTLER GUARD - Tenant-Aware Rate Limiting
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. MULTI-TENANT RATE LIMITING:
   * - Thay vì dùng một giới hạn chung cho toàn bộ server, guard này điều chỉnh
   *   limit dựa trên Gói Dịch Vụ (Plan) của cửa hàng hiện tại.
   *
   * 2. LOGIC PHÂN TẦNG:
   * - BASIC: 500 req/min (Dành cho shop nhỏ).
   * - PRO: 2000 req/min (Dành cho shop vừa).
   * - ENTERPRISE: 5000 req/min (Dành cho tập đoàn lớn).
   *
   * 3. FALLBACK:
   * - Nếu không xác định được Tenant (vd: public API chung), dùng limit mặc định.
   *
   * =====================================================================
   */

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const tenant = getTenant();

    // Determine base limit from plan
    let planLimit = 1000; // Global default
    if (tenant?.plan) {
      planLimit = PLAN_LIMITS[tenant.plan] || 1000;
    }

    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      const isUser = !!client.handshake?.user || !!client.request?.user;
      const effectiveLimit = isUser ? planLimit * 1.5 : planLimit;

      return super.handleRequest({
        ...requestProps,
        limit: Math.floor(effectiveLimit),
      });
    }

    const req = context.switchToHttp().getRequest();
    const isUser = !!req.user;

    // Users get 50% more quota than guests
    const effectiveLimit = isUser ? planLimit * 1.5 : planLimit;

    return super.handleRequest({
      ...requestProps,
      limit: Math.floor(effectiveLimit),
    });
  }
}
