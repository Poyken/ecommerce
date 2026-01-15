import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementService } from './procurement.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { InventoryService } from '@/inventory/inventory.service';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let prisma: PrismaService;

  const mockPrismaService = {
    supplier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    purchaseOrder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockInventoryService = {
    increaseStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<ProcurementService>(ProcurementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create a new supplier', async () => {
      const dto = {
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phone: '0123456789',
        tenantId: 'tenant-1',
      };

      const expectedSupplier = { id: 'supplier-1', ...dto };
      mockPrismaService.supplier.create.mockResolvedValue(expectedSupplier);

      const result = await service.createSupplier(dto);

      expect(result).toEqual(expectedSupplier);
      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('getSuppliers', () => {
    it('should return list of suppliers', async () => {
      const suppliers = [
        { id: 'supplier-1', name: 'Supplier 1' },
        { id: 'supplier-2', name: 'Supplier 2' },
      ];

      mockPrismaService.supplier.findMany.mockResolvedValue(suppliers);

      const result = await service.getSuppliers();

      expect(result).toEqual(suppliers);
    });
  });

  describe('createPurchaseOrder', () => {
    it('should create a purchase order with items', async () => {
      const userId = 'user-1';
      const dto = {
        supplierId: 'supplier-1',
        notes: 'Test PO',
        items: [
          { skuId: 'sku-1', quantity: 10, costPrice: 100000 },
          { skuId: 'sku-2', quantity: 5, costPrice: 200000 },
        ],
      };

      const expectedPO = {
        id: 'po-1',
        supplierId: dto.supplierId,
        status: 'PENDING',
        totalAmount: 2000000,
        items: dto.items,
      };

      mockPrismaService.purchaseOrder.create.mockResolvedValue(expectedPO);

      const result = await service.createPurchaseOrder(userId, dto);

      expect(result).toEqual(expectedPO);
    });
  });
});
