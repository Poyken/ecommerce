import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { AiChatModule } from '@/ai-chat/ai-chat.module';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * =============================================================================
 * INSIGHTS MODULE - PHÂN TÍCH KINH DOANH AI
 * =============================================================================
 *
 * Module này cung cấp:
 * 1. Tự động phân tích dữ liệu kinh doanh hàng ngày (Cronjob)
 * 2. AI Insights hiển thị trên Dashboard
 * 3. Gợi ý hành động cụ thể cho Admin
 *
 * =============================================================================
 */
@Module({
  imports: [AiChatModule, ScheduleModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
