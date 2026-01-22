import { PrismaService } from '@core/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxStatus } from '@prisma/client';
import { Queue } from 'bullmq';

/**
 * =====================================================================
 * OUTBOX PROCESSOR - Đảm bảo tính toàn vẹn sự kiện (Reliability)
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('orders-queue') private readonly ordersQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_SECOND) // Poll every second for near real-time
  async handleOutboxEvents() {
    if (this.isProcessing) return; // Prevent overlapping runs
    this.isProcessing = true;

    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { status: OutboxStatus.PENDING },
        take: 50, // Batch size
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Processing ${events.length} outbox events...`);

      for (const event of events) {
        try {
          /**
           */
          this.logger.log(
            `[Outbox] Dispatching: ${event.type} (ID: ${event.id})`,
          );

          await this.processEvent(event);

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.COMPLETED,
              processedAt: new Date(),
            },
          });

          this.logger.log(
            `[Outbox] ✅ Success: ${event.type} (ID: ${event.id})`,
          );
        } catch (error) {
          this.logger.error(
            `[Outbox] ❌ Failed: ${event.type} (ID: ${event.id}). Error: ${error.message}`,
          );
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.FAILED,
              error: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error fetching outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: any) {
    const payload = event.payload;

    switch (event.type) {
      case 'ORDER_CREATED_STOCK_CHECK':
        await this.ordersQueue.add('check-stock-release', payload, {
          delay: 15 * 60 * 1000,
        });
        break;

      case 'ORDER_CREATED_POST_PROCESS':
        await this.ordersQueue.add('order-created-post-process', payload);
        break;

      case 'LOW_STOCK_ALERT':
        await this.ordersQueue.add('low-stock-alert', payload);
        break;

      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }
}
