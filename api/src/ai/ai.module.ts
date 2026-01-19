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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DOMAIN AGGREGATION:
 * - Module này đóng vai trò là "Cửa ngõ" tập trung toàn bộ các tính năng AI.
 * - Giảm tải cho AppModule bằng cách gom nhóm các module liên quan (Chat, Agent, RAG...).
 *
 * 2. REUSABILITY:
 * - Các module con được `exports` để bất kỳ module nào khác trong hệ thống cũng có thể sử dụng (VD: Catalog dùng AI để tạo mô tả).
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cung cấp khả năng chat thông minh, phân tích dữ liệu kinh doanh và xử lý hình ảnh tự động.
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
