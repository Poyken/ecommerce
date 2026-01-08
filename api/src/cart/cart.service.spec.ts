import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('CartService', () => {
  let service: CartService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    cart: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    cartItem: {
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sku: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return cart with totals', async () => {
      mockPrismaService.cart.upsert.mockResolvedValue({
        id: 'cart-1',
        items: [
          { sku: { price: 100 }, quantity: 2 },
          { sku: { salePrice: 50 }, quantity: 1 },
        ],
      });

      const result = await service.getCart('u1');
      expect(result.totalAmount).toBe(250); // 100*2 + 50*1
      expect(result.totalItems).toBe(3);
    });
  });

  describe('addToCart', () => {
    it('should add item to cart', async () => {
      const dto = { skuId: 'sku-1', quantity: 2 };
      mockPrismaService.sku.findUnique.mockResolvedValue({
        id: 'sku-1',
        stock: 10,
        status: 'ACTIVE',
        price: 100,
      });
      mockPrismaService.cart.upsert.mockResolvedValue({ id: 'cart-1' });
      mockPrismaService.cartItem.upsert.mockResolvedValue({
        id: 'item-1',
        quantity: 2,
      });

      const result = await service.addToCart('u1', dto);
      expect(result.quantity).toBe(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw if sku checks fail', async () => {
      mockPrismaService.sku.findUnique.mockResolvedValue(null);
      await expect(
        service.addToCart('u1', { skuId: 'bad', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should cap quantity if stock exceeded', async () => {
      // Scenario: Stock 5. User adds 2.
      // Pre-existing in cart (simulated by upsert increment): 4.
      // Total 6 > 5. Should cap.
      mockPrismaService.sku.findUnique.mockResolvedValue({
        id: 'sku-1',
        stock: 5,
        status: 'ACTIVE',
      });
      mockPrismaService.cart.upsert.mockResolvedValue({ id: 'c1' });

      // Upsert returns the NEW quantity (4+2=6)
      mockPrismaService.cartItem.upsert.mockResolvedValue({
        id: 'i1',
        quantity: 6,
      });

      mockPrismaService.cartItem.update.mockResolvedValue({
        id: 'i1',
        quantity: 5,
      });

      // Adding 2 is valid (2 <= 5)
      const result = await service.addToCart('u1', {
        skuId: 's1',
        quantity: 2,
      });

      expect(result.capped).toBe(true);
      expect(mockPrismaService.cartItem.update).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should update valid item', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'i1',
        cart: { userId: 'u1' },
        sku: { stock: 10 },
      });
      mockPrismaService.cartItem.update.mockResolvedValue({ quantity: 5 });

      await service.updateItem('u1', 'i1', { quantity: 5 });
      expect(mockPrismaService.cartItem.update).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'i1',
        cart: { userId: 'u1' },
      });
      await service.removeItem('u1', 'i1');
      expect(mockPrismaService.cartItem.delete).toHaveBeenCalled();
    });
  });
});
