import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'n1',
        userId: 'u1',
        type: 'ORDER',
        title: 'Test',
        message: 'Test message',
      });

      const result = await service.create({
        userId: 'u1',
        type: 'ORDER',
        title: 'Test',
        message: 'Test message',
      });

      expect(result.id).toBe('n1');
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      mockPrismaService.notification.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5); // unreadCount

      const result = await service.findAll('u1', 20, 0);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.unreadCount).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markAsRead('n1', 'u1');
      expect(result.count).toBe(1);
    });

    it('should throw if not found', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markAsRead('n1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('u1');
      expect(result.count).toBe(5);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.delete('n1', 'u1');
      expect(result.message).toBe('Notification deleted successfully');
    });

    it('should throw if not found', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.delete('n1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('u1');
      expect(result).toBe(3);
    });
  });
});
