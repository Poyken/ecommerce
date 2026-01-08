import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('No permissions required', () => {
    it('should allow when no permissions defined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext({ roles: ['USER'], permissions: [] });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('SUPER_ADMIN bypass', () => {
    it('should allow SUPER_ADMIN access to any endpoint', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['admin:delete', 'admin:write']);
      const context = createMockContext({
        roles: ['SUPER_ADMIN'],
        permissions: [],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow SUPER_ADMIN even without specific permissions', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['superAdmin:write']);
      const context = createMockContext({
        roles: ['SUPER_ADMIN'],
        permissions: [],
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Regular permission checks', () => {
    it('should allow user with required permission', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['products:read']);
      const context = createMockContext({
        roles: ['ADMIN'],
        permissions: ['products:read', 'products:write'],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny user without required permission', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['users:delete']);
      const context = createMockContext({
        roles: ['ADMIN'],
        permissions: ['products:read'],
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should require ALL permissions (when using every)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['products:read', 'products:write']);
      const context = createMockContext({
        roles: ['ADMIN'],
        permissions: ['products:read'], // Missing products:write
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow when user has all required permissions', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['products:read', 'products:write']);
      const context = createMockContext({
        roles: ['ADMIN'],
        permissions: ['products:read', 'products:write', 'orders:read'],
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
