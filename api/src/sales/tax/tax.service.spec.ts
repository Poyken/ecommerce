import { Test, TestingModule } from '@nestjs/testing';
import { TaxService } from './tax.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TaxService', () => {
  let service: TaxService;

  const mockPrismaService = {
    taxRate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    orderTaxDetail: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTaxRate', () => {
    it('should create a new tax rate', async () => {
      const dto = { name: 'VAT 10%', rate: 10, isActive: true };
      const expectedTaxRate = { id: 'tax-1', ...dto, tenantId: 'tenant-1' };

      mockPrismaService.taxRate.create.mockResolvedValue(expectedTaxRate);

      const result = await service.createTaxRate('tenant-1', dto);

      expect(result).toEqual(expectedTaxRate);
      expect(mockPrismaService.taxRate.create).toHaveBeenCalled();
    });
  });

  describe('getTaxRates', () => {
    it('should return all tax rates for tenant', async () => {
      const taxRates = [
        { id: 'tax-1', name: 'VAT 10%', rate: 10 },
        { id: 'tax-2', name: 'VAT 5%', rate: 5 },
      ];

      mockPrismaService.taxRate.findMany.mockResolvedValue(taxRates);

      const result = await service.getTaxRates('tenant-1');

      expect(result).toEqual(taxRates);
    });
  });

  describe('getActiveTaxRates', () => {
    it('should return only active tax rates', async () => {
      const taxRates = [
        { id: 'tax-1', name: 'VAT 10%', rate: 10, isActive: true },
      ];

      mockPrismaService.taxRate.findMany.mockResolvedValue(taxRates);

      const result = await service.getActiveTaxRates('tenant-1');

      expect(result).toEqual(taxRates);
    });
  });

  describe('getTaxRateById', () => {
    it('should throw NotFoundException when tax rate not found', async () => {
      mockPrismaService.taxRate.findUnique.mockResolvedValue(null);

      await expect(
        service.getTaxRateById('tenant-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return tax rate when found', async () => {
      const taxRate = { id: 'tax-1', name: 'VAT 10%', rate: 10 };

      mockPrismaService.taxRate.findUnique.mockResolvedValue(taxRate);

      const result = await service.getTaxRateById('tenant-1', 'tax-1');

      expect(result).toEqual(taxRate);
    });
  });

  describe('applyTaxToOrder', () => {
    it('should apply tax to order and create OrderTaxDetail', async () => {
      const taxRate = {
        id: 'tax-1',
        name: 'VAT 10%',
        rate: 10,
        isActive: true,
      };
      const order = { id: 'order-1', totalAmount: 1000000 };

      mockPrismaService.taxRate.findUnique.mockResolvedValue(taxRate);
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.orderTaxDetail.create.mockResolvedValue({
        id: 'tax-detail-1',
        orderId: 'order-1',
        name: 'VAT 10%',
        rate: 10,
        amount: 100000, // 10% of 1000000
      });

      const result = await service.applyTaxToOrder('tenant-1', {
        orderId: 'order-1',
        taxRateId: 'tax-1',
      });

      expect(result.amount).toBeDefined();
    });
  });
});
