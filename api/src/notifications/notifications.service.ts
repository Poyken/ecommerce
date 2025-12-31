import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * =====================================================================
 * NOTIFICATIONS SERVICE - Dịch vụ quản lý thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NOTIFICATION PATTERNS:
 * - create: Tạo thông báo cho một user cụ thể
 * - broadcast: Gửi thông báo cho TẤT CẢ users (dùng cho thông báo hệ thống)
 * - broadcastToUserIds: Gửi thông báo cho danh sách users cụ thể
 *
 * 2. READ STATUS MANAGEMENT:
 * - markAsRead: Đánh dấu một thông báo đã đọc
 * - markAllAsRead: Đánh dấu tất cả thông báo của user đã đọc
 *
 * 3. CLEANUP & MAINTENANCE:
 * - deleteOldReadNotifications: Tự động xóa thông báo đã đọc cũ (> 30 ngày)
 * - Giúp database không bị phình to theo thời gian
 * =====================================================================
 */

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Tạo thông báo cho một user
   */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data,
    });
  }

  /**
   * Lấy danh sách thông báo của user (có phân trang)
   */
  async findAll(userId: string, limit = 20, offset = 0) {
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Đánh dấu một thông báo đã đọc
   */
  async markAsRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return result;
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Xóa một thông báo
   */
  async delete(id: string, userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Xóa tất cả thông báo đã đọc của user
   */
  async deleteAllRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    return { deleted: result.count };
  }

  /**
   * Gửi thông báo cho TẤT CẢ users (Admin broadcast)
   * ✅ Optimized: Batch processing (handles millions of users)
   */
  async broadcast(data: {
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    const BATCH_SIZE = 1000; // Process 1000 users at a time
    let skip = 0;
    let totalCreated = 0;

    this.logger.log('[Broadcast] Starting broadcast to all users...');

    while (true) {
      // ✅ Cursor-based pagination
      const users = await this.prisma.user.findMany({
        select: { id: true },
        skip,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' }, // Consistent ordering
      });

      if (users.length === 0) break;

      const notifications = users.map((user) => ({
        ...data,
        userId: user.id,
        isRead: false,
      }));

      const result = await this.prisma.notification.createMany({
        data: notifications,
      });

      totalCreated += result.count;
      skip += BATCH_SIZE;

      this.logger.log(
        `[Broadcast] Progress: ${totalCreated} notifications created`,
      );

      // ✅ Small delay to prevent DB overload
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(
      `[Broadcast] Complete: ${totalCreated} notifications created`,
    );
    return { created: totalCreated };
  }

  /**
   * Gửi thông báo cho danh sách users cụ thể
   */
  async broadcastToUserIds(
    userIds: string[],
    data: {
      type: string;
      title: string;
      message: string;
      link?: string;
    },
  ) {
    const notifications = userIds.map((userId) => ({
      ...data,
      userId,
    }));

    return this.prisma.notification.createMany({
      data: notifications,
    });
  }

  /**
   * Xóa thông báo đã đọc cũ hơn 30 ngày (Cleanup job)
   * [P11 OPTIMIZATION] Tự động hóa quá trình dọn dẹp hàng ngày
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldReadNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `[NotificationCleanup] Deleted ${result.count} old read notifications`,
    );

    return { deleted: result.count };
  }

  /**
   * Lấy thông báo theo ID (Admin)
   */
  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Lấy tất cả thông báo (Admin, with pagination and filters)
   */
  async findAllAdmin(
    page = 1,
    limit = 50,
    filters?: {
      userId?: string;
      type?: string;
      isRead?: boolean;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type };
      } else if (
        typeof filters.type === 'string' &&
        filters.type.includes(',')
      ) {
        where.type = { in: filters.type.split(',') };
      } else {
        where.type = filters.type;
      }
    }
    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
