/**
 * =====================================================================
 * OUTBOX-CLEANUP PROCESSOR - DỌN DẸP DỮ LIỆU TỰ ĐỘNG (BULLMQ)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này xử lý các công việc dọn dẹp hệ thống chạy ngầm định kỳ.
 *
 * 1. CHỨC NĂNG:
 *    - cleanup-outbox: Tìm và xóa các bản ghi OutboxEvent đã xử lý thành công (COMPLETED)
 *      và đã tồn tại hơn 7 ngày. Điều này giúp bảng OutboxEvent không bị phình to gây chậm DB.
 *
 * 2. CÁC KHÁI NIỆM LIÊN QUAN:
 *    - BullMQ Processor: Một hàm lắng nghe Job từ hàng đợi (Queue).
 *    - Cron Job: Tác vụ chạy định kỳ (VD: 12h đêm hàng ngày). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
