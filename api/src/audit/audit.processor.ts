import { PrismaService } from '@core/prisma/prisma.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * AUDIT PROCESSOR - NGƯỜI XỬ LÝ NHIỆM VỤ GHI CHÉP HÀNH VI
 * =====================================================================
 *
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
