import { PrismaModule } from '@/core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AiAutomationController } from './ai-automation.controller';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { GeminiService } from './gemini.service';

/**
 * =====================================================================
 * AI CHAT MODULE - Module cho tính năng chat AI
 * =====================================================================
 *
 * =====================================================================
 */

@Module({
  imports: [PrismaModule],
  controllers: [AiChatController, AiAutomationController],
  providers: [AiChatService, GeminiService],
  exports: [AiChatService, GeminiService],
})
export class AiChatModule {}
