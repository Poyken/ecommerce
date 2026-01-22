import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AiChatModule } from '@/ai/ai-chat/ai-chat.module';
import { ProductsModule } from '@/catalog/products/products.module';

/**
 * =============================================================================
 * AGENT MODULE - HỆ THỐNG AGENT TỰ HÀNH
 * =============================================================================
 *
 * =============================================================================
 */
@Module({
  imports: [AiChatModule, ProductsModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
