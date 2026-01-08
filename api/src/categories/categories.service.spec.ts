import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { CacheService } from '@core/cache/cache.service';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const mockPrismaService = {
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
  };

  const mockCacheService = {
    invalidatePattern: jest.fn(),
    getOrSet: jest.fn((key, cb) => cb()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        id: 'c1',
        name: 'Cat 1',
        slug: 'cat-1',
      });

      const result = await service.create({ name: 'Cat 1' });
      expect(result.id).toBe('c1');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalled();
    });

    it('should throw ConflictException if exists', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'c1' });
      await expect(service.create({ name: 'Cat 1' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if parent invalid', async () => {
      mockPrismaService.category.findFirst
        .mockResolvedValueOnce(null) // Not existing
        .mockResolvedValueOnce(null); // Parent check fail
      await expect(
        service.create({ name: 'Cat', parentId: 'bad' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([{ id: 'c1' }]);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'c1' }); // findOneBase usage
      mockPrismaService.category.update.mockResolvedValue({
        id: 'c1',
        name: 'New',
      });

      await service.update('c1', { name: 'New' });
      expect(mockCacheService.invalidatePattern).toHaveBeenCalled();
    });

    it('should throw Conflict if slug used by other', async () => {
      mockPrismaService.category.findFirst
        .mockResolvedValueOnce({ id: 'c1' }) // findOneBase
        .mockResolvedValueOnce({ id: 'c2' }); // Check slug collision

      await expect(service.update('c1', { slug: 'slug-2' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove category if clean', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null); // No products
      mockPrismaService.category.findFirst.mockResolvedValueOnce(null); // No children (for check)
      mockPrismaService.category.findFirst.mockResolvedValueOnce({ id: 'c1' }); // For findOneBase in softDeleteBase
      mockPrismaService.category.update.mockResolvedValue({
        id: 'c1',
        deletedAt: new Date(),
      });

      await service.remove('c1');
      expect(mockPrismaService.category.update).toHaveBeenCalled();
    });

    it('should block if has products', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'p1' });
      await expect(service.remove('c1')).rejects.toThrow(BadRequestException);
    });

    it('should block if has children', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'child' });
      await expect(service.remove('c1')).rejects.toThrow(BadRequestException);
    });
  });
});
