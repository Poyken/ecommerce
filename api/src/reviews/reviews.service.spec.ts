import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-123' }),
}));

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrismaService = {
    review: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockCacheManager = {
    del: jest.fn(),
    store: { keys: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        {
          provide: NotificationsGateway,
          useValue: { sendNotificationToUser: jest.fn() },
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create review if eligible', async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'o1' });
      mockPrismaService.review.create.mockResolvedValue({
        id: 'r1',
        rating: 5,
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: 1,
      });

      const result = await service.create('u1', {
        productId: 'p1',
        rating: 5,
        content: 'Great!',
      });
      expect(result.id).toBe('r1');
    });

    it('should throw if already reviewed', async () => {
      mockPrismaService.review.findFirst.mockResolvedValue({ id: 'r1' });
      await expect(
        service.create('u1', { productId: 'p1', rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if not purchased', async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.order.findFirst.mockResolvedValue(null);
      await expect(
        service.create('u1', { productId: 'p1', rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByProduct', () => {
    it('should return reviews with pagination', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([{ id: 'r1' }]);
      mockPrismaService.product.findUnique.mockResolvedValue({
        avgRating: 4.5,
        reviewCount: 10,
      });

      const result = await service.findAllByProduct('p1');
      expect(result.data).toHaveLength(1);
      expect(result.meta.averageRating).toBe(4.5);
    });
  });

  describe('updateStatus', () => {
    it('should update review approval status', async () => {
      mockPrismaService.review.findFirst.mockResolvedValue({
        id: 'r1',
        productId: 'p1',
      });
      mockPrismaService.review.update.mockResolvedValue({
        id: 'r1',
        isApproved: false,
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: 5,
      });

      const result = await service.updateStatus('r1', false);
      expect(result.isApproved).toBe(false);
    });
  });
});
