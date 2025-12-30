import { PrismaService } from '@core/prisma/prisma.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * AUDIT PROCESSOR - NGƯỜI XỬ LÝ NHIỆM VỤ GHI CHÉP HÀNH VI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WORKER HOST:
 * - Đây là một background worker lắng nghe queue `audit`.
 * - Nó nhặt các request từ Queue ra và thực hiện ghi vào Database.
 * - Việc này giúp giải phóng tài nguyên cho Main Thread của API, giúp API phản hồi nhanh hơn.
 *
 * 2. CÁC LOẠI JOB:
 * - `create-log`: Lưu nhật ký mới.
 * - `cleanup`: Xóa các nhật ký cũ (Job này thường được schedule chạy tự động hàng ngày).
 * =====================================================================
 */
@Processor('audit')
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'create-log':
        await this.handleCreateLog(job.data);
        break;
      case 'cleanup':
        await this.handleCleanup(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCreateLog(data: any) {
    try {
      await this.prisma.auditLog.create({
        data,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log in background:', error);
      throw error;
    }
  }

  private async handleCleanup(data: { days: number }) {
    const { days = 90 } = data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      this.logger.log(`[Cleanup] Deleted ${result.count} old audit logs`);
    } catch (error) {
      this.logger.error('Failed to cleanup audit logs in background:', error);
      throw error;
    }
  }
}
