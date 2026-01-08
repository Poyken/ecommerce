import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { PaymentService } from '@/payment/payment.service';
import { ShippingService } from '@/shipping/shipping.service';
import { InventoryService } from '@/skus/inventory.service';
import { CouponsService } from '@/coupons/coupons.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { EmailService } from '@integrations/email/email.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';

// Mock getTenant
jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    user: { findUnique: jest.fn() },
    cart: { findUnique: jest.fn() },
    sku: { findMany: jest.fn() },
    coupon: { findUnique: jest.fn(), update: jest.fn() },
    address: { findUnique: jest.fn() },
    order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    outboxEvent: { create: jest.fn() },
    notification: { findFirst: jest.fn() },
  };

  const mockPaymentService = {
    processPayment: jest.fn().mockResolvedValue({
      success: true,
      transactionId: 'trans-1',
      paymentUrl: 'http://test.com',
    }),
  };

  const mockShippingService = {
    calculateFee: jest.fn(),
    ghnService: { cancelOrder: jest.fn() },
  };

  const mockInventoryService = {
    reserveStock: jest.fn(),
    releaseStock: jest.fn(),
  };

  const mockEmailService = {
    sendOrderStatusUpdate: jest.fn().mockResolvedValue(true),
  };

  const mockQueue = { add: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: ShippingService, useValue: mockShippingService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: CouponsService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: NotificationsGateway, useValue: {} },
        { provide: EmailService, useValue: mockEmailService },
        { provide: getQueueToken('email-queue'), useValue: mockQueue },
        { provide: getQueueToken('orders-queue'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-1';
    const dto = {
      recipientName: 'Test',
      phoneNumber: '123',
      shippingAddress: 'Addr',
      addressId: 'addr-1',
      paymentMethod: 'COD',
    };

    it('should create order successfully', async () => {
      // Mocks
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            skuId: 'sku-1',
            quantity: 2,
            sku: { skuCode: 'SKU1' },
          },
        ],
      });
      mockPrismaService.sku.findMany.mockResolvedValue([
        {
          id: 'sku-1',
          skuCode: 'SKU1',
          stock: 10,
          status: 'ACTIVE',
          price: 100,
          optionValues: [],
          product: { name: 'Prod', slug: 'prod', images: [] },
        },
      ]);
      mockPrismaService.address.findUnique.mockResolvedValue({
        districtId: 1,
        wardCode: '1A',
      });
      mockShippingService.calculateFee.mockResolvedValue(30000);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        totalAmount: 230000,
      }); // 100*2 + 30000

      const result = await service.create(userId, dto as any);

      expect(result.id).toBe('order-1');
      expect(mockPrismaService.order.create).toHaveBeenCalled();
      expect(mockInventoryService.reserveStock).toHaveBeenCalledWith(
        'sku-1',
        2,
        expect.anything(),
      );
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalled();
    });

    it('should throw BadRequest if cart empty', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'c1',
        items: [],
      });
      await expect(service.create(userId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if stock insufficient', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'c1',
        items: [{ id: 'i1', skuId: 's1', quantity: 10 }],
      });
      mockPrismaService.sku.findMany.mockResolvedValue([
        { id: 's1', skuCode: 'S1', stock: 5, status: 'ACTIVE' },
      ]);

      await expect(service.create(userId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
        paymentMethod: 'COD',
        items: [],
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: 'o1',
        status: 'PROCESSING',
      });

      await service.updateStatus('o1', { status: 'PROCESSING' } as any);
      expect(mockPrismaService.order.update).toHaveBeenCalled();
    });

    it('should validate status transition', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
      });
      // Invalid: Pending -> Delivered directly
      await expect(
        service.updateStatus('o1', { status: 'DELIVERED' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
