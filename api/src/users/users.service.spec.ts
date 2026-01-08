import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { PlanUsageService } from '@/tenants/plan-usage.service';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue(null),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let planUsageService: PlanUsageService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
    },
    userRole: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockPlanUsageService = {
    checkStaffLimit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PlanUsageService, useValue: mockPlanUsageService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    planUsageService = module.get<PlanUsageService>(PlanUsageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'pass',
        firstName: 'F',
        lastName: 'L',
      };
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrismaService.user.create.mockResolvedValue({
        id: 'u1',
        ...dto,
        password: 'hashed',
      });

      const result = await service.create(dto);
      expect(result.id).toBe('u1');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPlanUsageService.checkStaffLimit).not.toHaveBeenCalled(); // No tenant
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });
      await expect(
        service.create({ email: 'e', password: 'p' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([{ id: 'u1' }]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });
      const result = await service.findOne('u1');
      expect(result.id).toBe('u1');
    });

    it('should throw NotFoundException', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.findOne('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' }); // for findOneBase check
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        firstName: 'Updated',
      });

      const result = await service.update('u1', { firstName: 'Updated' });
      expect(result.firstName).toBe('Updated');
    });

    it('should hash password if provided', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({ id: 'u1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await service.update('u1', { password: 'new' });
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        deletedAt: new Date(),
      });

      await service.remove('u1');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('assignRoles', () => {
    it('should assign roles via transaction', async () => {
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce({ id: 'u1' }) // validation
        .mockResolvedValueOnce({ id: 'u1', roles: [] }); // return updated

      mockPrismaService.role.findMany.mockResolvedValue([
        { id: 'r1', name: 'ADMIN' },
      ]);

      const result = await service.assignRoles('u1', ['ADMIN']);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      // Since we mocked $transaction to execute callback with mockPrismaService,
      // we should check if deleteMany and createMany were called on userRole
      expect(mockPrismaService.userRole.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.userRole.createMany).toHaveBeenCalled();
    });

    it('should throw BadRequest if role not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });
      mockPrismaService.role.findMany.mockResolvedValue([]); // Empty found

      await expect(service.assignRoles('u1', ['ADMIN'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
