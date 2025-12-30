import { PrismaModule } from '@/core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { GeminiService } from './gemini.service';

/**
 * =====================================================================
 * AI CHAT MODULE - Module cho tính năng chat AI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này đóng gói toàn bộ logic liên quan đến AI Chat:
 * - GeminiService: Kết nối Google Gemini API
 * - AiChatService: Business logic (RAG, session, history)
 * - AiChatController: REST API endpoints
 *
 * Để sử dụng, import module này vào AppModule.
 * =====================================================================
 */

@Module({
  imports: [PrismaModule],
  controllers: [AiChatController],
  providers: [AiChatService, GeminiService],
  exports: [AiChatService, GeminiService],
})
export class AiChatModule {}
