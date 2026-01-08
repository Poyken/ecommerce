import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('CouponsService', () => {
  let service: CouponsService;

  const mockPrismaService = {
    coupon: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new coupon', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue({
        id: 'c1',
        code: 'SALE10',
      });

      const result = await service.create({
        code: 'SALE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      } as any);
      expect(result.code).toBe('SALE10');
    });

    it('should throw ConflictException if code exists', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue({ id: 'c1' });
      await expect(service.create({ code: 'SALE10' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateCoupon', () => {
    const now = new Date();
    const validCoupon = {
      id: 'c1',
      code: 'VALID',
      isActive: true,
      startDate: new Date(now.getTime() - 86400000), // Yesterday
      endDate: new Date(now.getTime() + 86400000), // Tomorrow
      usageLimit: 100,
      usedCount: 0,
      minOrderAmount: 50000,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscountAmount: 20000,
    };

    it('should validate and return discount', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue(validCoupon);

      const result = await service.validateCoupon('VALID', 200000);
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(20000); // 10% of 200k = 20k, capped at maxDiscountAmount
    });

    it('should throw if coupon inactive', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue({
        ...validCoupon,
        isActive: false,
      });
      await expect(service.validateCoupon('INACTIVE', 100000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if order amount below minimum', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue(validCoupon);
      await expect(service.validateCoupon('VALID', 10000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if usage limit reached', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue({
        ...validCoupon,
        usedCount: 100,
      });
      await expect(service.validateCoupon('VALID', 100000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete coupon if not used', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue({ id: 'c1' });
      mockPrismaService.order.findFirst.mockResolvedValue(null);
      mockPrismaService.coupon.delete.mockResolvedValue({ id: 'c1' });

      await service.remove('c1');
      expect(mockPrismaService.coupon.delete).toHaveBeenCalled();
    });

    it('should throw if coupon used in orders', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue({ id: 'c1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'o1' });

      await expect(service.remove('c1')).rejects.toThrow(BadRequestException);
    });
  });
});
