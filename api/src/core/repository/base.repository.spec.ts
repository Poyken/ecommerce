import { BaseRepository, PaginatedResult } from './base.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  createMockTenant,
  createMockPrismaService,
  withTenantContext,
} from '@/testing/tenant.utils';
import * as tenantContext from '@core/tenant/tenant.context';

// Concrete implementation for testing
class TestRepository extends BaseRepository<any> {
  protected readonly modelName = 'testModel';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Expose protected methods for testing
  public getModelName() {
    return this.modelName;
  }

  public getTenantId() {
    return this.tenantId;
  }

  public callWithTenantFilter(where?: Record<string, any>) {
    return this.withTenantFilter(where);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    // Add testModel to mock
    (mockPrisma as any).testModel = {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: 'new-id', ...args.data }),
        ),
      update: jest
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: args.where.id, ...args.data }),
        ),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    };

    repository = new TestRepository(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('withTenantFilter', () => {
    it('should add tenantId when tenant context exists', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-123' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.callWithTenantFilter({ status: 'ACTIVE' });
      });

      expect(result).toEqual({
        status: 'ACTIVE',
        tenantId: 'tenant-123',
      });
    });

    it('should return original where when no tenant context', () => {
      jest.spyOn(tenantContext, 'getTenant').mockReturnValue(undefined);

      const result = repository.callWithTenantFilter({ status: 'ACTIVE' });

      expect(result).toEqual({ status: 'ACTIVE' });
    });
  });

  describe('findById', () => {
    it('should find by ID with tenant filter', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-456' });
      const mockRecord = { id: 'record-1', name: 'Test' };
      (mockPrisma as any).testModel.findFirst.mockResolvedValue(mockRecord);

      const result = await withTenantContext(mockTenant, () => {
        return repository.findById('record-1');
      });

      expect(result).toEqual(mockRecord);
      expect((mockPrisma as any).testModel.findFirst).toHaveBeenCalledWith({
        where: { id: 'record-1', tenantId: 'tenant-456' },
      });
    });
  });

  describe('findManyPaginated', () => {
    it('should return paginated results', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-789' });
      const mockRecords = [{ id: '1' }, { id: '2' }];

      (mockPrisma as any).testModel.findMany.mockResolvedValue(mockRecords);
      (mockPrisma as any).testModel.count.mockResolvedValue(25);

      const result = await withTenantContext(mockTenant, () => {
        return repository.findManyPaginated(
          { where: { status: 'ACTIVE' } },
          { page: 2, limit: 10 },
        );
      });

      expect(result.data).toEqual(mockRecords);
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        lastPage: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('should cap limit at 100', async () => {
      const mockTenant = createMockTenant();
      (mockPrisma as any).testModel.findMany.mockResolvedValue([]);
      (mockPrisma as any).testModel.count.mockResolvedValue(0);

      await withTenantContext(mockTenant, () => {
        return repository.findManyPaginated({}, { page: 1, limit: 500 });
      });

      expect((mockPrisma as any).testModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('create', () => {
    it('should add tenantId to create data', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-create' });

      await withTenantContext(mockTenant, () => {
        return repository.create({ name: 'New Item' });
      });

      expect((mockPrisma as any).testModel.create).toHaveBeenCalledWith({
        data: { name: 'New Item', tenantId: 'tenant-create' },
      });
    });
  });

  describe('exists', () => {
    it('should return true when count > 0', async () => {
      const mockTenant = createMockTenant();
      (mockPrisma as any).testModel.count.mockResolvedValue(5);

      const result = await withTenantContext(mockTenant, () => {
        return repository.exists({ status: 'ACTIVE' });
      });

      expect(result).toBe(true);
    });

    it('should return false when count = 0', async () => {
      const mockTenant = createMockTenant();
      (mockPrisma as any).testModel.count.mockResolvedValue(0);

      const result = await withTenantContext(mockTenant, () => {
        return repository.exists({ status: 'INACTIVE' });
      });

      expect(result).toBe(false);
    });
  });
});
