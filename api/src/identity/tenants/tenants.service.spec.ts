import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { TenantPlan } from '@prisma/client';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: PrismaService;

  const mockPrisma = {
    tenant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tenant and an admin user in a transaction', async () => {
      const dto = {
        name: 'Test Tenant',
        domain: 'test.com',
        plan: TenantPlan.PRO,
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
      };

      const mockTenant = { id: 'tenant-1', ...dto };
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      mockPrisma.role.findFirst.mockResolvedValue({
        id: 'role-1',
        name: 'ADMIN',
      });

      const result = await service.create(dto as any);

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          domain: dto.domain,
          plan: dto.plan,
          themeConfig: {},
        },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tenant if it exists and is not deleted', async () => {
      const mockTenant = { id: 'tenant-1', name: 'Test', deletedAt: null };
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne('tenant-1');
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException if tenant is deleted', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test',
        deletedAt: new Date(),
      };
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.findOne('tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a tenant', async () => {
      const mockTenant = { id: 'tenant-1', name: 'Test', deletedAt: null };
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        deletedAt: new Date(),
      });

      const result = await service.remove('tenant-1');
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
