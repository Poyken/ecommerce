import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LockdownGuard } from './lockdown.guard';

describe('LockdownGuard - Admin and SuperAdmin Integration', () => {
  let guard: LockdownGuard;
  let mockFeatureFlagsService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockFeatureFlagsService = {
      isEnabled: jest.fn(),
    };
    mockJwtService = {
      verify: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };
    guard = new LockdownGuard(
      mockFeatureFlagsService,
      mockJwtService,
      mockConfigService,
    );
  });

  const createMockContext = (
    path: string,
    token?: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          headers: {
            authorization: token ? `Bearer ${token}` : undefined,
          },
        }),
      }),
    } as ExecutionContext;
  };

  describe('When lockdown is disabled', () => {
    it('should allow all requests', async () => {
      mockFeatureFlagsService.isEnabled.mockResolvedValue(false);
      const context = createMockContext('/api/products');
      expect(await guard.canActivate(context)).toBe(true);
    });
  });

  describe('When lockdown is enabled', () => {
    beforeEach(() => {
      mockFeatureFlagsService.isEnabled.mockResolvedValue(true);
    });

    it('should allow health check paths', async () => {
      const context = createMockContext('/api/health');
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow auth login path', async () => {
      const context = createMockContext('/api/auth/login');
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow admin security path', async () => {
      const context = createMockContext('/api/admin/security');
      expect(await guard.canActivate(context)).toBe(true);
    });

    describe('Role-based bypass', () => {
      it('should allow ADMIN role during lockdown', async () => {
        // Fix: TokenService puts roles in 'roles' array, not 'role' string
        mockJwtService.verify.mockReturnValue({ roles: ['ADMIN'], sub: 'u1' });
        const context = createMockContext('/api/products', 'valid-token');
        expect(await guard.canActivate(context)).toBe(true);
      });

      it('should allow SUPER_ADMIN role during lockdown', async () => {
        // Fix: TokenService puts roles in 'roles' array
        mockJwtService.verify.mockReturnValue({
          roles: ['SUPER_ADMIN'],
          sub: 'u1',
        });
        const context = createMockContext('/api/products', 'valid-token');
        expect(await guard.canActivate(context)).toBe(true);
      });

      it('should block regular USER role during lockdown', async () => {
        mockJwtService.verify.mockReturnValue({ roles: ['USER'], sub: 'u1' });
        const context = createMockContext('/api/products', 'valid-token');
        await expect(guard.canActivate(context)).rejects.toThrow(
          ServiceUnavailableException,
        );
      });

      it('should block when no token provided during lockdown', async () => {
        const context = createMockContext('/api/products');
        await expect(guard.canActivate(context)).rejects.toThrow(
          ServiceUnavailableException,
        );
      });

      it('should block when token is invalid', async () => {
        mockJwtService.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });
        const context = createMockContext('/api/products', 'invalid-token');
        await expect(guard.canActivate(context)).rejects.toThrow(
          ServiceUnavailableException,
        );
      });
    });
  });
});
