import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { PrismaService } from '@core/prisma/prisma.service';

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('AddressesService', () => {
  let service: AddressesService;

  const mockPrismaService = {
    address: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create first address as default', async () => {
      mockPrismaService.address.count.mockResolvedValue(0);
      mockPrismaService.address.create.mockResolvedValue({
        id: 'addr1',
        isDefault: true,
      });

      const result = await service.create('u1', {
        recipientName: 'Test',
        phoneNumber: '123',
        street: '123 Main',
        city: 'HCM',
        district: 'Q1',
      });

      expect(result.isDefault).toBe(true);
    });

    it('should reset other defaults when creating default address', async () => {
      mockPrismaService.address.count.mockResolvedValue(1);
      mockPrismaService.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.address.create.mockResolvedValue({
        id: 'addr2',
        isDefault: true,
      });

      await service.create('u1', {
        recipientName: 'Test',
        phoneNumber: '123',
        street: '456 Main',
        city: 'HCM',
        district: 'Q3',
        isDefault: true,
      });

      expect(mockPrismaService.address.updateMany).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return addresses ordered by isDefault desc', async () => {
      mockPrismaService.address.findMany.mockResolvedValue([
        { id: 'a1', isDefault: true },
        { id: 'a2', isDefault: false },
      ]);

      const result = await service.findAll('u1');
      expect(result[0].isDefault).toBe(true);
    });
  });

  describe('update', () => {
    it('should update address', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
      });
      mockPrismaService.address.update.mockResolvedValue({
        id: 'a1',
        street: 'New St',
      });

      const result = await service.update('u1', 'a1', { street: 'New St' });
      expect(result.street).toBe('New St');
    });

    it('should throw if address not owned', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(service.update('u1', 'a1', {})).rejects.toThrow(
        'Address not found',
      );
    });
  });

  describe('remove', () => {
    it('should delete address', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
      });
      mockPrismaService.address.delete.mockResolvedValue({ id: 'a1' });

      const result = await service.remove('u1', 'a1');
      expect(result.id).toBe('a1');
    });

    it('should throw if address not owned', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(service.remove('u1', 'a1')).rejects.toThrow(
        'Address not found',
      );
    });
  });
});
