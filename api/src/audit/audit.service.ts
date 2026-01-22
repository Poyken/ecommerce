import { PrismaService } from '@core/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';

/**
 * =====================================================================
 * AUDIT SERVICE - HỆ THỐNG GHI NHẬT KÝ HOẠT ĐỘNG (AUDIT LOG)
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class AuditService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuditService.name);

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

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    roles?: string[],
    filter?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter && filter !== 'all') {
      if (filter === 'create')
        where.action = { contains: 'CREATE', mode: 'insensitive' };
      if (filter === 'update')
        where.action = { contains: 'UPDATE', mode: 'insensitive' };
      if (filter === 'delete')
        where.action = { contains: 'DELETE', mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roles && roles.length > 0) {
      where.user = {
        roles: {
          some: {
            role: {
              name: {
                in: roles,
              },
            },
          },
        },
      };
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
