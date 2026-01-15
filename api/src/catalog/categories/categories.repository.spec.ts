import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesRepository, CategoryTree } from './categories.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  createMockTenant,
  createMockPrismaService,
  withTenantContext,
} from '@/testing/tenant.utils';

describe('CategoriesRepository', () => {
  let repository: CategoriesRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      parentId: null,
      displayOrder: 0,
      children: [
        {
          id: 'cat-1-1',
          name: 'Phones',
          slug: 'phones',
          parentId: 'cat-1',
          children: [],
          _count: { products: 15 },
        },
      ],
      _count: { products: 50 },
    },
    {
      id: 'cat-2',
      name: 'Fashion',
      slug: 'fashion',
      parentId: null,
      displayOrder: 1,
      children: [],
      _count: { products: 30 },
    },
  ];

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    // Mock category model
    (mockPrisma as any).category = {
      findMany: jest.fn().mockResolvedValue(mockCategories),
      findFirst: jest.fn().mockResolvedValue(mockCategories[0]),
      count: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<CategoriesRepository>(CategoriesRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findAllFlat', () => {
    it('should return all categories in flat list', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.findAllFlat();
      });

      expect(result).toEqual(mockCategories);
      expect((mockPrisma as any).category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { displayOrder: 'asc' },
        }),
      );
    });
  });

  describe('findAsTree', () => {
    it('should return categories as tree structure', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.findAsTree();
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('productCount');
      expect(result[0]).toHaveProperty('children');
    });
  });

  describe('findBySlug', () => {
    it('should find category by slug with tenant filter', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.findBySlug('electronics');
      });

      expect(result).toEqual(mockCategories[0]);
      expect((mockPrisma as any).category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slug: 'electronics',
            tenantId: 'tenant-1',
          }),
        }),
      );
    });
  });

  describe('getBreadcrumb', () => {
    it('should return breadcrumb path for category', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      // Mock for breadcrumb building
      (mockPrisma as any).category.findFirst
        .mockResolvedValueOnce({
          id: 'cat-1-1',
          name: 'Phones',
          parentId: 'cat-1',
        })
        .mockResolvedValueOnce({
          id: 'cat-1',
          name: 'Electronics',
          parentId: null,
        });

      const result = await withTenantContext(mockTenant, () => {
        return repository.getBreadcrumb('cat-1-1');
      });

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Electronics');
      expect(result[1].name).toBe('Phones');
    });
  });
});
