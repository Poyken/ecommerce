import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '@/ai-chat/gemini.service';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =============================================================================
 * RAG SERVICE - RETRIEVAL AUGMENTED GENERATION (Kỹ thuật RAG)
 * =============================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * RAG là kỹ thuật giúp AI trả lời dựa trên "kiến thức riêng" của shop thay vì
 * chỉ dựa trên kiến thức chung của mô hình (Gemini).
 *
 * 1. QUY TRÌNH 3 BƯỚC:
 *    - Retrieval (Truy xuất): Tìm 5-10 đoạn văn băn liên quan nhất trong DB KnowledgeBase.
 *    - Augmentation (Bổ sung): Ghép các đoạn văn này vào Prompt gửi lên cho AI.
 *    - Generation (Sinh kết quả): AI đọc context và trả lời câu hỏi của User.
 *
 * 2. TẠI SAO CẦN?
 *    - Tránh AI "ảo tưởng" (Hallucination) về sản phẩm không có thật.
 *    - Luôn cập nhật thông tin tồn kho, khuyến mãi mới nhất của Shop.
 *
 * 3. CÁC MODULE LIÊN QUAN:
 *    - KnowledgeService: Chịu trách nhiệm Vectorize và Search (dùng pgvector).
 *    - GeminiService: Chịu trách nhiệm giao tiếp với Google AI.
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
