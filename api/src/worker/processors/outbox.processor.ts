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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. THE PROBLEM (Dual Write):
 * - Khi lưu Order vào DB xong, ta cần gửi Email.
 * - Nếu lưu DB thành công nhưng Server crash TRƯỚC khi kịp gửi job Email vào Queue -> Mất Email.
 * - User thấy đơn hàng thành công, nhưng không bao giờ nhận được mail.
 *
 * 2. TRANSACTIONAL OUTBOX PATTERN:
 * - Thay vì gửi trực tiếp vào Queue, ta lưu một bản ghi "Event" (OutboxEvent) vào DB
 *   CÙNG MỘT TRANSACTION với việc tạo Order.
 * - Đảm bảo: Nếu Order được tạo -> Chắc chắn Event được lưu.
 *
 * 3. TRIGGER & POLLING:
 * - Worker này (`handleOutboxEvents`) sẽ chạy định kỳ (mỗi giây) để quét các Event chưa xử lý.
 * - Nó lấy Event từ DB -> Đẩy vào BullMQ thật sự -> Đánh dấu là COMPLETED.
 * - Cơ chế này đảm bảo "At-least-once delivery" (Gửi ít nhất 1 lần).
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
           * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
           * Lưu vết log chi tiết giúp ta biết:
           * 1. Sự kiện nào đang được xử lý? (Type)
           * 2. Dữ liệu đầu vào là gì? (Payload)
           * 3. Kết quả thành công hay thất bại?
           * Điều này cực kỳ quan trọng khi hệ thống có hàng ngàn sự kiện chạy ngầm.
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

      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }
}
