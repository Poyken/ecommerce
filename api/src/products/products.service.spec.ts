import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { SkuManagerService } from './sku-manager.service';
import { RedisService } from '@core/redis/redis.service';
import { CacheService } from '@core/cache/cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PlanUsageService } from '@/tenants/plan-usage.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;
  let skuManager: SkuManagerService;
  let cacheService: CacheService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    brand: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    productOption: {
      deleteMany: jest.fn(),
    },
    productImage: {
      deleteMany: jest.fn(),
    },
    sku: {
      updateMany: jest.fn(),
    },
  };

  const mockSkuManager = {
    generateSkusForNewProduct: jest.fn(),
    smartSkuMigration: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn((key, cb) => cb()),
    invalidatePattern: jest.fn(),
  };

  const mockCacheManager = {
    set: jest.fn(),
    getItem: jest.fn(),
  };

  const mockPlanUsageService = {
    checkProductLimit: jest.fn(),
    incrementUsage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SkuManagerService, useValue: mockSkuManager },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: PlanUsageService, useValue: mockPlanUsageService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
    skuManager = module.get<SkuManagerService>(SkuManagerService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const dto = {
        name: 'Test Product',
        categoryIds: ['cat1'],
        brandId: 'brand1',
        price: 100,
        options: [],
        images: [],
      };

      mockPrismaService.category.findMany.mockResolvedValue([{ id: 'cat1' }]);
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'cat1' });
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 'brand1' });
      mockPrismaService.product.create.mockResolvedValue({
        id: 'prod1',
        ...dto,
      });

      const result = await service.create(dto as any);

      expect(result.id).toBe('prod1');
      expect(mockPrismaService.product.create).toHaveBeenCalled();
      expect(mockSkuManager.generateSkusForNewProduct).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category missing', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 'b' });
      await expect(
        service.create({ name: 'Test', categoryIds: ['c'] } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return product details', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        id: 'p1',
        name: 'Detail',
      });
      const result = await service.findOne('p1');
      expect(result.id).toBe('p1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      await expect(service.findOne('p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product and migrate skus', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        id: 'p1',
        skus: [],
      }); // old state
      // Transaction mock handling
      mockPrismaService.product.update.mockResolvedValue({ id: 'p1' });

      await service.update('p1', { name: 'New Name' });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockSkuManager.smartSkuMigration).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled(); // Invalidate cache
    });
  });

  describe('remove', () => {
    it('should soft delete product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrismaService.product.update.mockResolvedValue({
        id: 'p1',
        deletedAt: new Date(),
      });

      await service.remove('p1');

      expect(mockPrismaService.product.update).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });
});
