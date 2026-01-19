import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import {
  createMockTenant,
  createMockExecutionContext,
  withTenantContextSync,
} from '@/testing/tenant.utils';
import * as tenantContext from '@core/tenant/tenant.context';
import {
  REQUIRE_TENANT_KEY,
  SKIP_TENANT_CHECK_KEY,
} from '@core/tenant/tenant.decorator';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when @RequireTenant is NOT set', () => {
    it('should allow request without tenant context', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });
  });

  describe('when @RequireTenant IS set', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === REQUIRE_TENANT_KEY) return true;
        if (key === SKIP_TENANT_CHECK_KEY) return false;
        return undefined;
      });
    });

    it('should allow request with valid tenant context', () => {
      const mockTenant = createMockTenant();
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(mockTenant);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when no tenant context', () => {
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
      // We only check for ForbiddenException type because the message is inside the response object
      // in { statusCode: 403, error: 'Tenant Required', message: ... }
    });

    it('should throw ForbiddenException when tenant is suspended', () => {
      const suspendedTenant = createMockTenant({
        isActive: false,
        suspendedAt: new Date(),
        suspensionReason: 'Payment overdue',
      });
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(suspendedTenant);

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('when @SkipTenantCheck IS set', () => {
    it('should allow request even without tenant context', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SKIP_TENANT_CHECK_KEY) return true;
        if (key === REQUIRE_TENANT_KEY) return true;
        return undefined;
      });
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });
  });
});
