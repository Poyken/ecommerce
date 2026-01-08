import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { VietQrStrategy } from './strategies/vietqr.strategy';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCodStrategy = {
    processPayment: jest
      .fn()
      .mockResolvedValue({ success: true, transactionId: 'COD-123' }),
  };

  const mockStripeStrategy = {
    processPayment: jest
      .fn()
      .mockResolvedValue({ success: true, transactionId: 'STRIPE-123' }),
  };

  const mockVnPayStrategy = {
    processPayment: jest
      .fn()
      .mockResolvedValue({ success: true, paymentUrl: 'http://vnpay.test' }),
  };

  const mockMomoStrategy = {
    processPayment: jest
      .fn()
      .mockResolvedValue({ success: true, paymentUrl: 'http://momo.test' }),
  };

  const mockVietQrStrategy = {
    processPayment: jest
      .fn()
      .mockResolvedValue({ success: true, qrCode: 'base64...' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CodPaymentStrategy, useValue: mockCodStrategy },
        { provide: MockStripeStrategy, useValue: mockStripeStrategy },
        { provide: VNPayStrategy, useValue: mockVnPayStrategy },
        { provide: MoMoStrategy, useValue: mockMomoStrategy },
        { provide: VietQrStrategy, useValue: mockVietQrStrategy },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should process COD payment', async () => {
      const result = await service.processPayment('COD', {
        amount: 100000,
        orderId: 'o1',
      });
      expect(result.success).toBe(true);
      expect(mockCodStrategy.processPayment).toHaveBeenCalled();
    });

    it('should process VNPAY payment', async () => {
      const result = await service.processPayment('VNPAY', {
        amount: 200000,
        orderId: 'o2',
      });
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toBe('http://vnpay.test');
    });

    it('should throw BadRequest for unsupported method', async () => {
      await expect(
        service.processPayment('BITCOIN', { amount: 100, orderId: 'o1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook', () => {
    it('should update order to PAID on valid webhook', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-123',
        totalAmount: 100000,
        paymentStatus: 'PENDING',
        status: 'PENDING',
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: 'order-123',
        paymentStatus: 'PAID',
      });

      const result = await service.handleWebhook({
        content: 'Thanh toan don hang order-123',
        amount: 100000,
        gatewayTransactionId: 'TRX-001',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: expect.objectContaining({ paymentStatus: 'PAID' }),
      });
    });

    it('should skip if order already PAID', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-123',
        paymentStatus: 'PAID',
      });

      const result = await service.handleWebhook({
        content: 'order-123',
        amount: 100000,
      });

      expect(result.message).toBe('Order already paid');
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw NotFound if order not in content', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.handleWebhook({
          content: 'random text',
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequest if amount insufficient', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-123',
        totalAmount: 200000,
        paymentStatus: 'PENDING',
      });

      await expect(
        service.handleWebhook({
          content: 'order-123',
          amount: 50000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
