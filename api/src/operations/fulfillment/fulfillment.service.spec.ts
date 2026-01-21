import { Test, TestingModule } from '@nestjs/testing';
import { FulfillmentService } from './fulfillment.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FulfillmentService', () => {
  let service: FulfillmentService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    shipment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillmentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FulfillmentService>(FulfillmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createShipment('tenant-1', {
          orderId: 'non-existent',
          items: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when quantity exceeds remaining', async () => {
      const mockOrder = {
        id: 'order-1',
        items: [{ id: 'item-1', quantity: 5 }],
        shipments: [
          {
            items: [{ orderItemId: 'item-1', quantity: 3 }],
          },
        ],
        status: 'PENDING',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.createShipment('tenant-1', {
          orderId: 'order-1',
          items: [{ orderItemId: 'item-1', quantity: 5 }], // Exceeds remaining (5-3=2)
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create shipment successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        items: [{ id: 'item-1', quantity: 10, skuId: 'sku-1' }],
        shipments: [],
        status: 'PENDING',
      };

      const expectedShipment = {
        id: 'shipment-1',
        orderId: 'order-1',
        status: 'PENDING',
        items: [{ orderItemId: 'item-1', quantity: 5 }],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.shipment.create.mockResolvedValue(expectedShipment);

      const result = await service.createShipment('tenant-1', {
        orderId: 'order-1',
        items: [{ orderItemId: 'item-1', quantity: 5 }],
      });

      expect(result).toEqual(expectedShipment);
    });
  });

  describe('getShipments', () => {
    it('should return all shipments for tenant', async () => {
      const shipments = [
        { id: 'shipment-1', orderId: 'order-1' },
        { id: 'shipment-2', orderId: 'order-2' },
      ];

      mockPrismaService.shipment.findMany.mockResolvedValue(shipments);

      const result = await service.getShipments('tenant-1');

      expect(result).toEqual(shipments);
    });

    it('should filter shipments by orderId', async () => {
      const shipments = [{ id: 'shipment-1', orderId: 'order-1' }];

      mockPrismaService.shipment.findMany.mockResolvedValue(shipments);

      const result = await service.getShipments('tenant-1', 'order-1');

      expect(result).toEqual(shipments);
    });
  });
});
