import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * REVIEWS MODULE - Module quản lý đánh giá và phản hồi
 * =====================================================================
 *
 * =====================================================================
 */
import { CloudinaryModule } from '@/platform/integrations/external/cloudinary/cloudinary.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AiSentimentService } from './ai-sentiment.service';

import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule, HttpModule],
  providers: [ReviewsService, AiSentimentService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
