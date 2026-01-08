import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { GHNService } from './ghn.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { EmailService } from '@integrations/email/email.service';
import { OrderStatus } from '@prisma/client';

describe('ShippingService', () => {
  let service: ShippingService;
  let prismaService: PrismaService;

  const mockGHNService = {
    getProvinces: jest
      .fn()
      .mockResolvedValue([{ ProvinceID: 1, ProvinceName: 'HCM' }]),
    getDistricts: jest
      .fn()
      .mockResolvedValue([{ DistrictID: 1, DistrictName: 'Q1' }]),
    getWards: jest
      .fn()
      .mockResolvedValue([{ WardCode: '001', WardName: 'Ward 1' }]),
    calculateFee: jest.fn().mockResolvedValue(30000),
  };

  const mockPrismaService = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({ id: 'n1' }),
  };

  const mockNotificationsGateway = {
    sendNotificationToUser: jest.fn(),
  };

  const mockEmailService = {
    sendOrderStatusUpdate: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: GHNService, useValue: mockGHNService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProvinces', () => {
    it('should return provinces', async () => {
      const result = await service.getProvinces();
      expect(result).toHaveLength(1);
      expect(mockGHNService.getProvinces).toHaveBeenCalled();
    });
  });

  describe('calculateFee', () => {
    it('should calculate shipping fee', async () => {
      const fee = await service.calculateFee(1, '001');
      expect(fee).toBe(30000);
      expect(mockGHNService.calculateFee).toHaveBeenCalledWith({
        to_district_id: 1,
        to_ward_code: '001',
        weight: 1000,
        length: 10,
        width: 10,
        height: 10,
      });
    });
  });

  describe('handleGHNWebhook', () => {
    it('should update order status on picked', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        id: 'o1',
        shippingCode: 'GHN123',
        status: 'PROCESSING',
        ghnStatus: null,
        userId: 'u1',
      });
      mockPrismaService.order.update.mockResolvedValue({});
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        user: { email: 'test@test.com' },
        items: [],
      });

      const result = await service.handleGHNWebhook({
        OrderCode: 'GHN123',
        Status: 'picked',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: expect.objectContaining({ status: OrderStatus.SHIPPED }),
      });
    });

    it('should update order status on delivered', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        id: 'o1',
        shippingCode: 'GHN123',
        status: 'SHIPPED',
        ghnStatus: 'picked',
        userId: 'u1',
      });
      mockPrismaService.order.update.mockResolvedValue({});
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        user: { email: 'test@test.com' },
        items: [],
      });

      const result = await service.handleGHNWebhook({
        OrderCode: 'GHN123',
        Status: 'delivered',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: expect.objectContaining({ status: OrderStatus.DELIVERED }),
      });
    });

    it('should ignore unrecognized status', async () => {
      const result = await service.handleGHNWebhook({
        OrderCode: 'GHN123',
        Status: 'sorting',
      });

      expect(result.message).toBe('Status ignored');
    });

    it('should return error for invalid payload', async () => {
      const result = await service.handleGHNWebhook({});
      expect(result.success).toBe(false);
    });
  });
});
