import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * =====================================================================
 * NEWSLETTER MODULE - Module quản lý bản tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NOTIFICATIONS INTEGRATION:
 * - Module này phụ thuộc vào `NotificationsModule` để có thể sử dụng các hàng đợi (Queues) gửi email.
 *
 * 2. FEATURE ENCAPSULATION:
 * - Gom nhóm các logic liên quan đến việc thu thập email khách hàng và gửi tin khuyến mãi.
 * =====================================================================
 */
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [NotificationsModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
