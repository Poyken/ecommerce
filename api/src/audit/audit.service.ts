import { PrismaService } from '@core/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';

/**
 * =====================================================================
 * AUDIT SERVICE - HỆ THỐNG GHI NHẬT KÝ HOẠT ĐỘNG (AUDIT LOG)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ASYNC LOGGING (Ghi log bất đồng bộ):
 * - Việc ghi log không được làm chậm request của người dùng.
 * - Vì vậy, ta không ghi trực tiếp vào DB mà đẩy vào `auditQueue` (BullMQ/Redis).
 * - Một worker sẽ chạy ngầm để lấy dữ liệu từ queue và lưu vào DB sau.
 *
 * 2. AUTOMATED CLEANUP (Tự động dọn dẹp):
 * - Log hệ thống tích tụ rất nhanh. Hàm `onApplicationBootstrap` sẽ tạo một job chạy định kỳ mỗi đêm để xóa các log cũ (ví dụ: quá 90 ngày) để tiết kiệm dung lượng DB.
 *
 * 3. IP & USER-AGENT:
 * - Luôn lưu lại IP và thiết bị của người dùng để phục vụ việc điều tra khi có sự cố bảo mật.
 * =====================================================================
 */
@Injectable()
export class AuditService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuditService.name);

<<<<<<< HEAD
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('audit') private readonly auditQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    // Schedule repeatable cleanup job every day at midnight
    await this.auditQueue.add(
      'cleanup',
      { days: 90 },
      {
        repeat: {
          pattern: '0 0 * * *', // Every midnight
        },
        jobId: 'audit-log-cleanup',
        removeOnComplete: true,
      },
    );
    this.logger.log('Audit log cleanup job scheduled successfully.');
  }

  /**
   * Tạo audit log - [P11 OPTIMIZATION] Xử lý bất đồng bộ qua queue
   */
=======
  /**
   * =====================================================================
   * AUDIT SERVICE - Nhật ký hệ thống
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. MỤC ĐÍCH (PURPOSE):
   * - Ghi lại mọi hành động quan trọng của người dùng (Who did What, When, Where).
   * - Giúp Admin tra cứu lịch sử, phát hiện hành vi bất thường hoặc lỗi hệ thống.
   *
   * 2. FAIL-SAFE LOGGING:
   * - Việc ghi log KHÔNG ĐƯỢC PHÉP làm chết luồng chính (Main Flow).
   * - Nếu DB bị lỗi hoặc chưa migrate bảng AuditLog, ta chỉ `console.error` chứ không throw exception ra ngoài.
   * - Điều này đảm bảo tính năng chính (VD: Đặt hàng) vẫn hoạt động dù hệ thống log có vấn đề.
   *
   * 3. SEARCHABLE (Có thể tìm kiếm):
   * - Hỗ trợ tìm kiếm theo `action` (Hành động) hoặc `resource` (Đối tượng bị tác động) để dễ dàng trace lỗi.
   * =====================================================================
   */

>>>>>>> 7e5e004 (feat: Implement new e-commerce features including audit, coupons, blog, wishlist, payment, shipping, and various web actions.)
  async create(data: {
    userId?: string;
    action: string;
    resource: string;
    payload?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Chúng ta dùng try-catch để phòng trường hợp DB chưa migrate table AuditLog
    try {
      // ✅ Offload to background queue
      await this.auditQueue.add('create-log', data, {
        removeOnComplete: true,
        removeOnFail: 1000, // Keep failed jobs for debugging
      });
      return { status: 'queued' };
    } catch (error) {
      this.logger.error('Failed to queue audit log:', error);
      // Fallback to direct create if queue fails (optional, but safer)
      return null;
    }
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
