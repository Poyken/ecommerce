import { Module } from '@nestjs/common';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { AgentModule } from './agent/agent.module';
import { InsightsModule } from './insights/insights.module';
import { RagModule } from './rag/rag.module';
import { ImageProcessorModule } from './images/image-processor.module';

/**
 * =====================================================================
 * AI MODULE - Hệ sinh thái Trí tuệ nhân tạo
 * =====================================================================
 *
 * =====================================================================
 */

@Module({
  imports: [
    AiChatModule,
    AgentModule,
    InsightsModule,
    RagModule,
    ImageProcessorModule,
  ],
  exports: [
    AiChatModule,
    AgentModule,
    InsightsModule,
    RagModule,
    ImageProcessorModule,
  ],
})
export class AiModule {}
