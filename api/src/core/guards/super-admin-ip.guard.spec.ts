import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuperAdminIpGuard } from './super-admin-ip.guard';

describe('SuperAdminIpGuard', () => {
  let guard: SuperAdminIpGuard;

  beforeEach(() => {
    guard = new SuperAdminIpGuard();
  });

  const createMockContext = (
    user: any,
    ip: string,
    xForwardedFor?: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          ip,
          headers: {
            'x-forwarded-for': xForwardedFor,
          },
          socket: {
            remoteAddress: ip,
          },
        }),
      }),
    } as ExecutionContext;
  };

  describe('Non-SuperAdmin users', () => {
    it('should allow regular users', () => {
      const context = createMockContext({ roles: ['USER'] }, '192.168.1.1');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow Admin users', () => {
      const context = createMockContext({ roles: ['ADMIN'] }, '192.168.1.1');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow when no user', () => {
      const context = createMockContext(null, '192.168.1.1');
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('SuperAdmin users', () => {
    it('should allow SuperAdmin from localhost (127.0.0.1)', () => {
      const context = createMockContext(
        { roles: ['SUPER_ADMIN'] },
        '127.0.0.1',
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow SuperAdmin from localhost IPv6 (::1)', () => {
      const context = createMockContext({ roles: ['SUPER_ADMIN'] }, '::1');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow SuperAdmin with empty whitelist (no lockout)', () => {
      const context = createMockContext(
        { roles: ['SUPER_ADMIN'], whitelistedIps: [] },
        '8.8.8.8',
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow SuperAdmin from whitelisted IP', () => {
      const context = createMockContext(
        { roles: ['SUPER_ADMIN'], whitelistedIps: ['192.168.1.100'] },
        '192.168.1.100',
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should block SuperAdmin from non-whitelisted IP', () => {
      const context = createMockContext(
        { roles: ['SUPER_ADMIN'], whitelistedIps: ['192.168.1.100'] },
        '10.0.0.1',
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should use x-forwarded-for header for IP detection', () => {
      const context = createMockContext(
        { roles: ['SUPER_ADMIN'], whitelistedIps: ['1.2.3.4'] },
        '192.168.1.1',
        '1.2.3.4, 10.0.0.1',
      );
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
