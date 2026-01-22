import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/notifications/notifications.module';

/**
 * =====================================================================
 * NEWSLETTER MODULE - Module quản lý bản tin
 * =====================================================================
 *
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
