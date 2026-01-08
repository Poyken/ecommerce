import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { PrismaService } from '@core/prisma/prisma.service';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-123' }),
}));

describe('WishlistService', () => {
  let service: WishlistService;

  const mockPrismaService = {
    wishlist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggle', () => {
    it('should add to wishlist if not exists', async () => {
      mockPrismaService.wishlist.findUnique.mockResolvedValue(null);
      mockPrismaService.wishlist.create.mockResolvedValue({ id: 'w1' });

      const result = await service.toggle('u1', 'p1');
      expect(result.isWishlisted).toBe(true);
      expect(mockPrismaService.wishlist.create).toHaveBeenCalled();
    });

    it('should remove from wishlist if exists', async () => {
      mockPrismaService.wishlist.findUnique.mockResolvedValue({ id: 'w1' });
      mockPrismaService.wishlist.delete.mockResolvedValue({});

      const result = await service.toggle('u1', 'p1');
      expect(result.isWishlisted).toBe(false);
      expect(mockPrismaService.wishlist.delete).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return wishlist with pagination', async () => {
      mockPrismaService.wishlist.findMany.mockResolvedValue([
        { id: 'w1', product: {} },
      ]);
      mockPrismaService.wishlist.count.mockResolvedValue(1);

      const result = await service.findAll('u1');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('checkStatus', () => {
    it('should return true if wishlisted', async () => {
      mockPrismaService.wishlist.findUnique.mockResolvedValue({ id: 'w1' });
      const result = await service.checkStatus('u1', 'p1');
      expect(result.isWishlisted).toBe(true);
    });

    it('should return false if not wishlisted', async () => {
      mockPrismaService.wishlist.findUnique.mockResolvedValue(null);
      const result = await service.checkStatus('u1', 'p1');
      expect(result.isWishlisted).toBe(false);
    });
  });

  describe('mergeWishlist', () => {
    it('should merge guest wishlist to user', async () => {
      mockPrismaService.wishlist.findUnique.mockResolvedValue(null);
      mockPrismaService.wishlist.create.mockResolvedValue({});

      const result = await service.mergeWishlist('u1', ['p1', 'p2']);
      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
    });
  });
});
