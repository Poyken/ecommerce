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

  /**
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   * Tại sao phải dọn dẹp nhiều bảng cùng lúc?
   * 1. AuditLog: Ghi lại hành động, tích tụ rất nhanh -> Xóa sau 90 ngày.
   * 2. PerformanceMetric: Các chỉ số hiệu năng chỉ cần thiết trong ngắn hạn để debug -> Xóa sau 90 ngày.
   * 3. OutboxEvent: Đây là các sự kiện tạm để đồng bộ dữ liệu, sau khi xử lý xong chỉ nên giữ lại 7 ngày để đối soát.
   */
  private async handleCleanup(data: { days: number }) {
    const { days = 90 } = data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Short-lived data cutoff
    const outboxCutoff = new Date();
    outboxCutoff.setDate(outboxCutoff.getDate() - 7); // Keep only 7 days of processed outbox events

    try {
      const [auditResult, metricsResult, outboxResult] = await Promise.all([
        // 1. Cleanup Audit Logs
        this.prisma.auditLog.deleteMany({
          where: { createdAt: { lt: cutoffDate } },
        }),
        // 2. Cleanup Performance Metrics
        this.prisma.performanceMetric.deleteMany({
          where: { createdAt: { lt: cutoffDate } },
        }),
        // 3. Cleanup Processed Outbox Events
        this.prisma.outboxEvent.deleteMany({
          where: {
            createdAt: { lt: outboxCutoff },
            status: { not: 'PENDING' },
          },
        }),
      ]);

      this.logger.log(
        `[Cleanup] Deleted ${auditResult.count} audit logs, ${metricsResult.count} performance metrics, ${outboxResult.count} outbox events`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup logs in background:', error);
      throw error;
    }
  }
}
