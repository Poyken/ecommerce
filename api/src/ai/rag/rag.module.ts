/**
 * =====================================================================
 * RAG.MODULE MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này đóng gói các thành phần liên quan lại với nhau.
 *
 * 1. CẤU TRÚC MODULE:
 *    - imports: Các module khác cần sử dụng
 *    - controllers: Các controller xử lý request
 *    - providers: Các service cung cấp logic
 *    - exports: Các service cho module khác sử dụng *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { KnowledgeService } from './knowledge.service';
import { AiChatModule } from '@/ai/ai-chat/ai-chat.module';

/**
 * =============================================================================
 * RAG MODULE - RETRIEVAL AUGMENTED GENERATION
 * =============================================================================
 *
 * Module này cung cấp:
 * 1. Knowledge indexing - Đánh index sản phẩm và chính sách shop
 * 2. Vector search - Tìm kiếm thông tin liên quan
 * 3. AI Response - Trả lời dựa trên context
 *
 * Multi-tenancy: Mỗi shop có knowledge base riêng biệt
 *
 * =============================================================================
 */
@Module({
  imports: [AiChatModule],
  controllers: [RagController],
  providers: [RagService, KnowledgeService],
  exports: [RagService, KnowledgeService],
})
export class RagModule {}
