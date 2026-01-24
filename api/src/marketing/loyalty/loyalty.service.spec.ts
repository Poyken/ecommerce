import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoyaltyPointType } from './dto/loyalty.dto';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  const mockPrismaService = {
    loyaltyPoint: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailService = {
    sendLoyaltyPointsEarned: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('earnPoints', () => {
    it('should throw BadRequestException when amount is not positive', async () => {
      await expect(
        service.earnPoints('tenant-1', {
          userId: 'user-1',
          amount: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create earned points successfully', async () => {
      const expectedPoint = {
        id: 'point-1',
        userId: 'user-1',
        amount: 100,
        type: LoyaltyPointType.EARNED,
      };

      mockPrismaService.loyaltyPoint.create.mockResolvedValue(expectedPoint);

      const result = await service.earnPoints('tenant-1', {
        userId: 'user-1',
        amount: 100,
      });

      expect(result).toEqual(expectedPoint);
    });
  });

  describe('earnPointsFromOrder', () => {
    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.earnPointsFromOrder('tenant-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate points based on order total (1 point per 1000)', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        totalAmount: 500000, // Should earn 500 points
      };

      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.loyaltyPoint.create.mockResolvedValue({
        id: 'point-1',
        userId: 'user-1',
        orderId: 'order-1',
        amount: 500,
        type: LoyaltyPointType.EARNED,
      });

      const result = await service.earnPointsFromOrder('tenant-1', 'order-1');

      expect(result?.amount).toBe(500);
    });
  });

  describe('redeemPoints', () => {
    it('should throw BadRequestException when insufficient balance', async () => {
      // First call for EARNED points
      mockPrismaService.loyaltyPoint.aggregate.mockResolvedValueOnce({
        _sum: { amount: 50 },
      });
      // Second call for REDEEMED/REFUNDED points (0 used)
      mockPrismaService.loyaltyPoint.aggregate.mockResolvedValueOnce({
        _sum: { amount: 0 },
      });

      await expect(
        service.redeemPoints('tenant-1', {
          userId: 'user-1',
          amount: 100, // Trying to redeem more than balance (50)
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should redeem points successfully when balance is sufficient', async () => {
      // First call for EARNED points
      mockPrismaService.loyaltyPoint.aggregate.mockResolvedValueOnce({
        _sum: { amount: 200 },
      });
      // Second call for REDEEMED/REFUNDED points (0 used)
      mockPrismaService.loyaltyPoint.aggregate.mockResolvedValueOnce({
        _sum: { amount: 0 },
      });

      mockPrismaService.loyaltyPoint.create.mockResolvedValue({
        id: 'point-1',
        userId: 'user-1',
        amount: -100, // Negative for redemption
        type: LoyaltyPointType.REDEEMED,
      });

      const result = await service.redeemPoints('tenant-1', {
        userId: 'user-1',
        amount: 100,
      });

      expect(result.amount).toBe(-100);
    });
  });

  describe('getUserPointBalance', () => {
    it('should return sum of all points for user', async () => {
      // Mocking aggregate is tricky because getUserPointBalance calls it only once
      // BUT getAvailableBalance calls it twice.
      // Wait, getUserPointBalance code:
      // const result = await (this.prisma as any).loyaltyPoint.aggregate({ ... _sum: { amount: true } });
      // It only calls ONCE. So previous mockResolvedValue was correct for this method?
      // Let's check the code for getUserPointBalance. Yes, it calls aggregate once.
      // BUT, if other tests run before/after, we need to be careful.
      // Resetting mocks in beforeEach/afterEach helps.

      mockPrismaService.loyaltyPoint.aggregate.mockResolvedValue({
        _sum: { amount: 150 },
      });

      const result = await service.getUserPointBalance('tenant-1', 'user-1');

      expect(result).toBe(150);
    });

    it('should return 0 when no points exist', async () => {
      mockPrismaService.loyaltyPoint.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getUserPointBalance('tenant-1', 'user-1');

      expect(result).toBe(0);
    });
  });

  describe('getUserPointHistory', () => {
    it('should return point history for user', async () => {
      const history = [
        { id: 'point-1', amount: 100, type: LoyaltyPointType.EARNED },
        { id: 'point-2', amount: -50, type: LoyaltyPointType.REDEEMED },
      ];

      mockPrismaService.loyaltyPoint.findMany.mockResolvedValue(history);

      const result = await service.getUserPointHistory('tenant-1', 'user-1');

      expect(result.data).toEqual(history); // getUserPointHistory returns { data, meta }
    });
  });
});
