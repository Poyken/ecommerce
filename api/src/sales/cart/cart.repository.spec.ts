import { Test, TestingModule } from '@nestjs/testing';
import { CartRepository, CartWithItems } from './cart.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  createMockTenant,
  createMockPrismaService,
  withTenantContext,
} from '@/testing/tenant.utils';

describe('CartRepository', () => {
  let repository: CartRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    items: [
      {
        id: 'item-1',
        skuId: 'sku-1',
        quantity: 2,
        sku: {
          id: 'sku-1',
          price: 100,
          salePrice: 80,
          product: { id: 'prod-1', name: 'Test Product', slug: 'test-product' },
        },
      },
    ],
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    // Mock cart and cartItem models
    (mockPrisma as any).cart = {
      findFirst: jest.fn().mockResolvedValue(mockCart),
      findMany: jest.fn().mockResolvedValue([mockCart]),
      create: jest
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: 'new-cart', ...args.data, items: [] }),
        ),
      count: jest.fn().mockResolvedValue(1),
    };

    (mockPrisma as any).cartItem = {
      create: jest.fn().mockResolvedValue({ id: 'new-item' }),
      update: jest.fn().mockResolvedValue({ id: 'item-1' }),
      delete: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<CartRepository>(CartRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findByUser', () => {
    it('should find cart by user ID with tenant filter', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.findByUser('user-1');
      });

      expect(result).toEqual(mockCart);
      expect((mockPrisma as any).cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            tenantId: 'tenant-1',
          }),
        }),
      );
    });
  });

  describe('findOrCreate', () => {
    it('should return existing cart if found', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.findOrCreate('user-1');
      });

      expect(result).toEqual(mockCart);
      expect((mockPrisma as any).cart.create).not.toHaveBeenCalled();
    });

    it('should create new cart if not found', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });
      (mockPrisma as any).cart.findFirst.mockResolvedValueOnce(null);

      const result = await withTenantContext(mockTenant, () => {
        return repository.findOrCreate('new-user');
      });

      expect((mockPrisma as any).cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'new-user',
            tenantId: 'tenant-1',
          }),
        }),
      );
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      await withTenantContext(mockTenant, () => {
        return repository.addItem('user-1', 'sku-2', 3);
      });

      expect((mockPrisma as any).cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            skuId: 'sku-2',
            quantity: 3,
            tenantId: 'tenant-1',
          }),
        }),
      );
    });

    it('should update quantity if item already exists', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      await withTenantContext(mockTenant, () => {
        return repository.addItem('user-1', 'sku-1', 3); // sku-1 already in cart
      });

      expect((mockPrisma as any).cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: { quantity: 5 }, // 2 existing + 3 added
        }),
      );
    });
  });

  describe('calculateTotal', () => {
    it('should calculate cart totals correctly', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      const result = await withTenantContext(mockTenant, () => {
        return repository.calculateTotal('user-1');
      });

      // 2 items * 80 (salePrice) = 160
      expect(result.subtotal).toBe(160);
      expect(result.itemCount).toBe(2);
    });

    it('should return zero for non-existent cart', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });
      (mockPrisma as any).cart.findFirst.mockResolvedValueOnce(null);

      const result = await withTenantContext(mockTenant, () => {
        return repository.calculateTotal('unknown-user');
      });

      expect(result.subtotal).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('should delete all items from cart', async () => {
      const mockTenant = createMockTenant({ id: 'tenant-1' });

      await withTenantContext(mockTenant, () => {
        return repository.clear('user-1');
      });

      expect((mockPrisma as any).cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
    });
  });
});
