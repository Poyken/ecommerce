import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

// Mock tenant context
jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-1' }),
}));

describe('BrandsService', () => {
  let service: BrandsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    brand: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new brand', async () => {
      mockPrismaService.brand.findFirst.mockResolvedValue(null);
      mockPrismaService.brand.create.mockResolvedValue({
        id: 'b1',
        name: 'Brand 1',
      });

      const result = await service.create({ name: 'Brand 1' });
      expect(result.id).toBe('b1');
    });

    it('should throw ConflictException if brand exists', async () => {
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 'b1' });
      await expect(service.create({ name: 'Brand 1' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return brands list', async () => {
      mockPrismaService.brand.findMany.mockResolvedValue([{ id: 'b1' }]);
      mockPrismaService.brand.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update brand', async () => {
      mockPrismaService.brand.findFirst
        .mockResolvedValueOnce({ id: 'b1', name: 'Old' }) // findOne check
        .mockResolvedValueOnce(null); // name conflict check

      mockPrismaService.brand.update.mockResolvedValue({
        id: 'b1',
        name: 'New',
      });

      await service.update('b1', { name: 'New' });
      expect(mockPrismaService.brand.update).toHaveBeenCalled();
    });

    it('should throw Conflict if name used by another', async () => {
      mockPrismaService.brand.findFirst
        .mockResolvedValueOnce({ id: 'b1' }) // findOne check
        .mockResolvedValueOnce({ id: 'b2' }); // conflict check

      await expect(service.update('b1', { name: 'New' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove brand if no products', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 'b1' }); // For softDeleteBase finding
      mockPrismaService.brand.update.mockResolvedValue({
        id: 'b1',
        deletedAt: new Date(),
      });

      await service.remove('b1');
      expect(mockPrismaService.brand.update).toHaveBeenCalled();
    });

    it('should throw BadRequest if products rely on it', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'p1' });
      await expect(service.remove('b1')).rejects.toThrow(BadRequestException);
    });
  });
});
