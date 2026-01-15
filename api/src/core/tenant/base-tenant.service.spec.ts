import { ForbiddenException } from '@nestjs/common';
import { BaseTenantService } from './base-tenant.service';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  createMockTenant,
  createMockPrismaService,
  withTenantContext,
} from '@/testing/tenant.utils';
import * as tenantContext from './tenant.context';

// Concrete implementation for testing
class TestTenantService extends BaseTenantService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Expose protected methods for testing
  public getTenantId() {
    return this.tenantId;
  }

  public getTenant() {
    return this.tenant;
  }

  public checkHasTenantContext() {
    return this.hasTenantContext;
  }

  public callRequireTenant() {
    return this.requireTenant();
  }

  public callTenantWhere(additional?: Record<string, unknown>) {
    return this.tenantWhere(additional);
  }

  public callWithTenantId(data: Record<string, unknown>) {
    return this.withTenantId(data);
  }
}

describe('BaseTenantService', () => {
  let service: TestTenantService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    service = new TestTenantService(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('tenantId getter', () => {
    it('should return tenantId when tenant context exists', async () => {
      const mockTenant = createMockTenant({ id: 'custom-tenant-id' });

      const result = await withTenantContext(mockTenant, () => {
        return service.getTenantId();
      });

      expect(result).toBe('custom-tenant-id');
    });

    it('should throw ForbiddenException when no tenant context', () => {
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      expect(() => service.getTenantId()).toThrow(ForbiddenException);
      expect(() => service.getTenantId()).toThrow('Tenant context is required');
    });
  });

  describe('tenant getter', () => {
    it('should return full tenant object when context exists', async () => {
      const mockTenant = createMockTenant({ name: 'Test Store' });

      const result = await withTenantContext(mockTenant, () => {
        return service.getTenant();
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Store');
    });

    it('should return null when no tenant context', () => {
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      const result = service.getTenant();

      expect(result).toBeNull();
    });
  });

  describe('hasTenantContext', () => {
    it('should return true when tenant context exists', async () => {
      const mockTenant = createMockTenant();

      const result = await withTenantContext(mockTenant, () => {
        return service.checkHasTenantContext();
      });

      expect(result).toBe(true);
    });

    it('should return false when no tenant context', () => {
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      const result = service.checkHasTenantContext();

      expect(result).toBe(false);
    });
  });

  describe('requireTenant', () => {
    it('should return tenant when context exists', async () => {
      const mockTenant = createMockTenant();

      const result = await withTenantContext(mockTenant, () => {
        return service.callRequireTenant();
      });

      expect(result).toEqual(expect.objectContaining({ id: mockTenant.id }));
    });

    it('should throw ForbiddenException when no tenant context', () => {
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      expect(() => service.callRequireTenant()).toThrow(ForbiddenException);
    });
  });

  describe('tenantWhere', () => {
    it('should create where condition with tenantId', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-123' });

      const result = await withTenantContext(mockTenant, () => {
        return service.callTenantWhere({ status: 'ACTIVE' });
      });

      expect(result).toEqual({
        status: 'ACTIVE',
        tenantId: 'tenant-123',
      });
    });

    it('should work without additional conditions', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-456' });

      const result = await withTenantContext(mockTenant, () => {
        return service.callTenantWhere();
      });

      expect(result).toEqual({ tenantId: 'tenant-456' });
    });
  });

  describe('withTenantId', () => {
    it('should add tenantId to data object', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-789' });

      const result = await withTenantContext(mockTenant, () => {
        return service.callWithTenantId({ name: 'Test Product', price: 100 });
      });

      expect(result).toEqual({
        name: 'Test Product',
        price: 100,
        tenantId: 'tenant-789',
      });
    });
  });
});
