import { PrismaService } from '@core/prisma/prisma.service';
import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { createPaginatedResult } from '@/common/dto/base.dto';
import { NotificationsGateway } from './notifications.gateway';

/**
 * =====================================================================
 * NOTIFICATIONS SERVICE - Dịch vụ quản lý thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CÁC KIỂU GỬI THÔNG BÁO (Notification Patterns):
 * - `create`: Gửi thông báo cho 1 User cụ thể.
 * - `broadcast`: Gửi thông báo cho TẤT CẢ User (Dùng cho thông báo bảo trì, sự kiện toàn sàn).
 * - `broadcastToUserIds`: Gửi cho 1 nhóm User cụ thể (VD: Nhóm khách hàng VIP).
 *
 * 2. QUẢN LÝ TRẠNG THÁI (Read Status):
 * - `markAsRead`: User bấm vào xem thông báo -> Đánh dấu đã đọc.
 * - `markAllAsRead`: Nút "Đánh dấu tất cả là đã đọc".
 *
 * 3. DỌN DẸP DỮ LIỆU (Cleanup):
 * - `deleteOldReadNotifications`: Một Cron-job chạy ngầm mỗi đêm.
 * - Nhiệm vụ: Xóa các thông báo đã đọc và cũ hơn 30 ngày để giảm tải cho DB. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Gửi thông báo thời gian thực (Websocket) hoặc Email tới người dùng khi có sự kiện quan trọng như đơn hàng mới, cập nhật kho hoặc phản hồi review.

 * =====================================================================
 */

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Tạo thông báo cho một user.
   */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await (this.prisma.notification as any).create({
      data,
    });

    // Real-time push
    this.gateway.sendNotificationToUser(data.userId, notification);

    return notification;
  }

  /**
   * Lấy danh sách thông báo của user (Có phân trang).
   * - Trả về kèm số lượng chưa đọc (unreadCount) để hiển thị badge trên UI.
   */
  async findAll(userId: string, limit = 20, offset = 0) {
    const [items, total, unreadCount] = await Promise.all([
      (this.prisma.notification as any).findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      (this.prisma.notification as any).count({ where: { userId } }),
      (this.prisma.notification as any).count({
        where: { userId, isRead: false },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;

    return {
      ...createPaginatedResult(items, total, page, limit),
      unreadCount,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Đếm số thông báo chưa đọc (Dùng cho pooling hoặc lấy state ban đầu).
   */
  async getUnreadCount(userId: string) {
    return (this.prisma.notification as any).count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Đánh dấu một thông báo là đã đọc.
   */
  async markAsRead(id: string, userId: string) {
    const result = await (this.prisma.notification as any).updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Thông báo không tồn tại hoặc không thuộc về bạn',
      );
    }

    // Real-time update count
    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.server
      .to(`user:${userId}`)
      .emit('unread_count', { count: unreadCount });

    return result;
  }

  /**
   * Đánh dấu TẤT CẢ thông báo là đã đọc.
   */
  async markAllAsRead(userId: string) {
    const result = await (this.prisma.notification as any).updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    // Real-time update count
    this.gateway.server.to(`user:${userId}`).emit('unread_count', { count: 0 });

    return result;
  }

  /**
   * Xóa một thông báo.
   */
  async delete(id: string, userId: string) {
    const result = await (this.prisma.notification as any).deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    return { message: 'Xóa thông báo thành công' };
  }

  /**
   * Xóa tất cả thông báo đã đọc của user (Dọn dẹp thủ công).
   */
  async deleteAllRead(userId: string) {
    const result = await (this.prisma.notification as any).deleteMany({
      where: { userId, isRead: true },
    });

    return { deleted: result.count };
  }

  /**
   * Gửi thông báo cho TẤT CẢ users (Admin Broadcast).
   * ✅ TỐI ƯU HÓA: Xử lý theo lô (Batch Processing) để có thể gửi cho hàng triệu user mà không treo DB.
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

    this.logger.log('[Broadcast] Bắt đầu gửi thông báo toàn hệ thống...');

    while (true) {
      // ✅ Phân trang bằng con trỏ (Cursor-based pagination) để duyệt qua toàn bộ user
      const users = await this.prisma.user.findMany({
        select: { id: true },
        skip,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' }, // Sắp xếp ID tăng dần để đảm bảo tính nhất quán
      });

      if (users.length === 0) break;

      const notifications = users.map((user) => ({
        ...data,
        userId: user.id,
        isRead: false,
      }));

      const result = await (this.prisma.notification as any).createMany({
        data: notifications,
      });

      // Gateway broadcast (optional: if we want live popups for online users during broadcast)
      this.gateway.broadcastNotification(data);

      totalCreated += result.count;
      skip += BATCH_SIZE;

      this.logger.log(`[Broadcast] Tiến độ: Đã tạo ${totalCreated} thông báo`);

      // ✅ Thêm độ trễ nhỏ (100ms) để tránh làm quá tải Database (Throttle)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(
      `[Broadcast] Complete: ${totalCreated} notifications created`,
    );
    return { created: totalCreated };
  }

  /**
   * Gửi thông báo cho một danh sách User ID cụ thể.
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

    return (this.prisma.notification as any).createMany({
      data: notifications,
    });
  }

  /**
   * Xóa thông báo đã đọc cũ hơn 30 ngày (Cron Job).
   * [P11 OPTIMIZATION] Giúp Database luôn gọn nhẹ và truy vấn nhanh.
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
      `[NotificationCleanup] Đã xóa ${result.count} thông báo cũ đã đọc.`,
    );

    return { deleted: result.count };
  }

  /**
   * Lấy thông báo theo ID (Admin)
   */
  async findOne(id: string) {
    const notification = await (this.prisma.notification as any).findUnique({
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
  /**
   * Lấy tất cả thông báo (Admin, with pagination and filters)
   */
  async findAllAdmin(dto: FilterNotificationDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (dto.userId) {
      where.userId = dto.userId;
    }
    if (dto.type) {
      if (dto.type.includes(',')) {
        where.type = { in: dto.type.split(',') };
      } else {
        where.type = dto.type;
      }
    }
    if (dto.isRead !== undefined) {
      where.isRead = dto.isRead;
    }

    const [items, total] = await Promise.all([
      (this.prisma.notification as any).findMany({
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
      (this.prisma.notification as any).count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }
}
