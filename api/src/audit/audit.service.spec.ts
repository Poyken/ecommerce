import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrismaService = {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken('audit'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should queue audit log for async processing', async () => {
      const result = await service.create({
        userId: 'u1',
        action: 'CREATE',
        resource: 'Product',
        payload: { id: 'p1' },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'create-log',
        expect.any(Object),
        expect.any(Object),
      );
      expect(result.status).toBe('queued');
    });

    it('should handle queue failure gracefully', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

      const result = await service.create({
        action: 'DELETE',
        resource: 'Order',
      });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        { id: 'log1', action: 'CREATE', resource: 'Product' },
      ]);
      mockPrismaService.auditLog.count.mockResolvedValue(10);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(10);
    });

    it('should filter by search term', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAll(1, 10, 'DELETE');

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });
});
