import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getTenant } from '@core/tenant/tenant.context';
import {
  REQUIRE_TENANT_KEY,
  SKIP_TENANT_CHECK_KEY,
} from '@core/tenant/tenant.decorator';

/**
 * =====================================================================
 * TENANT GUARD - BẢO VỆ ENDPOINTS DỰA TRÊN TENANT CONTEXT
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Kiểm tra @SkipTenantCheck - ưu tiên cao nhất
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      this.logger.debug('Tenant check skipped by @SkipTenantCheck decorator');
      return true;
    }

    // 2. Kiểm tra @RequireTenant trên method hoặc class
    const requireTenant = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có @RequireTenant, cho phép request đi tiếp
    if (!requireTenant) {
      return true;
    }

    // 3. Lấy tenant từ context
    const tenant = getTenant();

    if (!tenant) {
      // Lấy thông tin request để logging
      const request = context.switchToHttp().getRequest();
      const { method, url, ip } = request;

      this.logger.warn({
        message: 'Request blocked: Missing tenant context',
        method,
        url,
        ip,
        handler: context.getHandler().name,
        controller: context.getClass().name,
      });

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Tenant Required',
        message:
          'This operation requires a valid tenant context. Please ensure you are accessing the API through a valid tenant domain.',
      });
    }

    // 4. Kiểm tra tenant có active không
    if (!tenant.isActive) {
      this.logger.warn({
        message: 'Request blocked: Tenant is suspended',
        tenantId: tenant.id,
        tenantName: tenant.name,
        suspendedAt: tenant.suspendedAt,
        reason: tenant.suspensionReason,
      });

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Tenant Suspended',
        message:
          'This store is currently suspended. Please contact support for assistance.',
        reason: tenant.suspensionReason,
      });
    }

    // 5. Tất cả checks passed
    this.logger.debug({
      message: 'Tenant guard passed',
      tenantId: tenant.id,
      tenantName: tenant.name,
    });

    return true;
  }
}
