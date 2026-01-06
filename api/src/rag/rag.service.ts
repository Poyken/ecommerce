import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '@/ai-chat/gemini.service';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =============================================================================
 * RAG SERVICE - RETRIEVAL AUGMENTED GENERATION
 * =============================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * RAG là kỹ thuật kết hợp:
 * 1. Retrieval - Tìm kiếm thông tin liên quan từ database
 * 2. Augmentation - Bổ sung thông tin vào prompt
 * 3. Generation - AI sinh câu trả lời dựa trên context
 *
 * Flow:
 * User hỏi: "Áo này còn size M không?"
 * → Tìm thông tin sản phẩm liên quan
 * → Gửi kèm context cho AI
 * → AI trả lời dựa trên dữ liệu thực
 *
 * =============================================================================
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly knowledgeService: KnowledgeService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Trả lời câu hỏi khách hàng với RAG
   */
  async answer(
    tenantId: string,
    question: string,
    chatHistory: ChatMessage[] = [],
  ): Promise<string> {
    this.logger.log(`RAG Query: "${question}" for tenant: ${tenantId}`);

    try {
      // 1. Get tenant info
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });
      const shopName = tenant?.name || 'Shop';

      // 2. Search relevant knowledge
      const relevantChunks = await this.knowledgeService.searchKnowledge(
        tenantId,
        question,
        5,
      );

      // 3. Get policies
      const policies = await this.knowledgeService.getPolicies(tenantId);

      // 4. Build context
      const context = this.knowledgeService.buildContext(
        relevantChunks,
        policies,
      );

      // 5. Generate response using Gemini
      const response = await this.geminiService.answerWithContext(
        question,
        context ||
          'Không có thông tin sản phẩm. Hãy giới thiệu shop một cách chung.',
        shopName,
      );

      this.logger.log(`RAG Response generated for tenant: ${tenantId}`);
      return response;
    } catch (error) {
      this.logger.error('RAG answer failed', error);
      return 'Dạ em xin lỗi, hệ thống đang bận. Anh/chị vui lòng thử lại sau hoặc liên hệ hotline shop ạ! 🙏';
    }
  }

  /**
   * Refresh knowledge base cho tenant
   */
  async refreshKnowledge(tenantId: string): Promise<{
    productsIndexed: number;
  }> {
    const productsIndexed = await this.knowledgeService.indexProducts(tenantId);
    return { productsIndexed };
  }

  /**
   * Set shop policy
   */
  async setPolicy(
    tenantId: string,
    policyType: 'shipping' | 'return' | 'payment' | 'contact',
    content: string,
  ): Promise<void> {
    await this.knowledgeService.setShopPolicy(tenantId, policyType, content);
  }

  /**
   * Get conversation suggestions
   */
  getSuggestedQuestions(): string[] {
    return [
      'Shop ở đâu?',
      'Ship Hà Nội bao lâu?',
      'Có hỗ trợ đổi trả không?',
      'Thanh toán bằng cách nào?',
      'Sản phẩm này còn size M không?',
    ];
  }
}
