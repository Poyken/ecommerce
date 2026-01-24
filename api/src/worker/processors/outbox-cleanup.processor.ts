/**
 * =====================================================================
 * OUTBOX-CLEANUP PROCESSOR - DỌN DẸP DỮ LIỆU TỰ ĐỘNG (BULLMQ)
 * =====================================================================
 *
 * =====================================================================
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Processor('cron-jobs') // Assumes a 'cron-jobs' queue exists or will be targeted
export class OutboxCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxCleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing cron job: ${job.name}`);

    if (job.name === 'cleanup-outbox') {
      return this.cleanupOutbox();
    }
  }

  /**
   * Delete COMPLETED outbox events older than 7 days
   */
  private async cleanupOutbox() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const result = await this.prisma.outboxEvent.deleteMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} processed outbox events.`);
      return { deleted: result.count };
    } catch (error) {
      this.logger.error('Failed to cleanup outbox events', error);
      throw error;
    }
  }
}
