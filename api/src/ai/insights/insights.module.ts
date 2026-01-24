/**
 * =====================================================================
 * AI INSIGHTS MODULE - TRUNG TÂM PHÂN TÍCH DL CỬA HÀNG
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AiChatModule } from '../ai-chat/ai-chat.module';

@Module({
  imports: [PrismaModule, AiChatModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
