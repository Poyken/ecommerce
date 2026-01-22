import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
import { VNPayStrategy } from './strategies/vnpay.strategy';
import { MoMoStrategy } from './strategies/momo.strategy';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from '@/sales/orders/orders.repository';

/**
 * =====================================================================
 * PAYMENT SERVICE UNIT TESTS
 * =====================================================================
 *
 * =====================================================================
 */

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: jest.Mocked<PrismaService>;
  let ordersRepo: jest.Mocked<OrdersRepository>; // Add Type
  let codStrategy: jest.Mocked<CodPaymentStrategy>;
  let mockStripeStrategy: jest.Mocked<MockStripeStrategy>;
  let vnpayStrategy: jest.Mocked<VNPayStrategy>;
  let momoStrategy: jest.Mocked<MoMoStrategy>;

  // Mock data
  const mockOrder = {
    id: 'order-123',
    totalAmount: 500000,
    paymentStatus: 'PENDING',
    status: 'PENDING',
  };

  const mockPaymentDetails = {
    amount: 500000,
    orderId: 'order-123',
    returnUrl: 'https://example.com/return',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    // Mock Orders Repository
    const mockOrdersRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockCodStrategy = {
      processPayment: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'COD-order-123',
      }),
    };

    const mockMockStripeStrategy = {
      processPayment: jest.fn().mockResolvedValue({
        success: true,
        paymentUrl: 'https://stripe.com/pay/123',
        transactionId: 'STRIPE-123',
      }),
    };

    const mockVnpayStrategy = {
      processPayment: jest.fn().mockResolvedValue({
        success: true,
        paymentUrl: 'https://vnpay.vn/pay/123',
        transactionId: 'VNPAY-123',
      }),
    };

    const mockMomoStrategy = {
      processPayment: jest.fn().mockResolvedValue({
        success: true,
        paymentUrl: 'https://momo.vn/pay/123',
        transactionId: 'MOMO-123',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrdersRepository, useValue: mockOrdersRepository }, // Provide Mock
        { provide: CodPaymentStrategy, useValue: mockCodStrategy },
        { provide: MockStripeStrategy, useValue: mockMockStripeStrategy },
        { provide: VNPayStrategy, useValue: mockVnpayStrategy },
        { provide: MoMoStrategy, useValue: mockMomoStrategy },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get(PrismaService);
    ordersRepo = module.get(OrdersRepository); // Get Mock
    codStrategy = module.get(CodPaymentStrategy);
    mockStripeStrategy = module.get(MockStripeStrategy);
    vnpayStrategy = module.get(VNPayStrategy);
    momoStrategy = module.get(MoMoStrategy);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =====================================================================
  // #region PROCESS PAYMENT TESTS
  // =====================================================================

  describe('processPayment', () => {
    it('should process COD payment correctly', async () => {
      // Act
      const result = await service.processPayment('COD', mockPaymentDetails);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('COD');
      expect(codStrategy.processPayment).toHaveBeenCalledWith(
        mockPaymentDetails,
      );
    });

    it('should process CREDIT_CARD payment via Stripe', async () => {
      // Act
      const result = await service.processPayment(
        'CREDIT_CARD',
        mockPaymentDetails,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toContain('stripe');
      expect(mockStripeStrategy.processPayment).toHaveBeenCalledWith(
        mockPaymentDetails,
      );
    });

    it('should process VNPAY payment correctly', async () => {
      // Act
      const result = await service.processPayment('VNPAY', mockPaymentDetails);

      // Assert
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toContain('vnpay');
      expect(vnpayStrategy.processPayment).toHaveBeenCalledWith(
        mockPaymentDetails,
      );
    });

    it('should process MOMO payment correctly', async () => {
      // Act
      const result = await service.processPayment('MOMO', mockPaymentDetails);

      // Assert
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toContain('momo');
      expect(momoStrategy.processPayment).toHaveBeenCalledWith(
        mockPaymentDetails,
      );
    });

    it('should throw BadRequestException for unsupported payment method', async () => {
      // Act & Assert
      await expect(
        service.processPayment('BITCOIN', mockPaymentDetails),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle case-insensitive payment method', async () => {
      // Act
      const result = await service.processPayment('cod', mockPaymentDetails);

      // Assert
      expect(result.success).toBe(true);
      expect(codStrategy.processPayment).toHaveBeenCalled();
    });
  });

  // #endregion

  // =====================================================================
  // #region WEBHOOK HANDLER TESTS
  // =====================================================================

  describe('handleWebhook', () => {
    const validWebhookPayload = {
      content: 'THANHTOAN order-123',
      amount: 500000,
      gatewayTransactionId: 'TRX-123',
    };

    it('should process valid webhook and update order', async () => {
      // Arrange
      // UPDATE: mock ordersRepo instead of prismaService.order
      ordersRepo.findById.mockResolvedValue(mockOrder as any);
      ordersRepo.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'PAID',
      } as any);

      // Act
      const result = await service.handleWebhook(validWebhookPayload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-123');
      expect(ordersRepo.update).toHaveBeenCalledWith(
        'order-123',
        expect.objectContaining({
          paymentStatus: 'PAID',
        }),
      );
    });

    it('should skip processing for already paid orders', async () => {
      // Arrange
      // UPDATE: mock ordersRepo
      ordersRepo.findById.mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'PAID',
      } as any);

      // Act
      const result = await service.handleWebhook(validWebhookPayload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('đã được thanh toán');
      expect(ordersRepo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent order', async () => {
      // Arrange
      // UPDATE: mock ordersRepo
      ordersRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.handleWebhook({ content: 'invalid-content', amount: 100000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient payment amount', async () => {
      // Arrange
      // UPDATE: mock ordersRepo
      ordersRepo.findById.mockResolvedValue(mockOrder as any);

      // Act & Assert
      await expect(
        service.handleWebhook({
          content: 'order-123',
          amount: 100000, // Less than 500000
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should parse order ID from various content formats', async () => {
      // Arrange
      // UPDATE: mock ordersRepo
      ordersRepo.findById.mockResolvedValue(mockOrder as any);
      ordersRepo.update.mockResolvedValue(mockOrder as any);

      const payloads = [
        { content: 'order-123', amount: 500000 },
        { content: 'TT order-123', amount: 500000 },
        { content: 'THANHTOAN order-123 ABC', amount: 500000 },
      ];

      // Act & Assert
      for (const payload of payloads) {
        const result = await service.handleWebhook(payload);
        expect(result.success).toBe(true);
      }
    });
  });

  // #endregion
});
