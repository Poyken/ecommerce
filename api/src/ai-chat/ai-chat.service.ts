import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { AiChatRole } from '@prisma/client';
import { GeminiService } from './gemini.service';

/**
 * =====================================================================
 * AI CHAT SERVICE - Xử lý logic chat với AI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RAG (Retrieval Augmented Generation):
 * - Trước khi gọi AI, ta tìm kiếm sản phẩm liên quan trong database.
 * - Inject thông tin sản phẩm vào system prompt để AI trả lời chính xác.
 *
 * 2. SESSION MANAGEMENT:
 * - Guest: Dùng guestId (UUID từ localStorage) để track session.
 * - Logged-in: Dùng userId, lưu lịch sử chat lâu dài.
 *
 * 3. HISTORY CONTEXT:
 * - Lấy N tin nhắn gần nhất để AI hiểu context cuộc hội thoại.
 * - Giới hạn số tin để tránh exceed token limit.
 * =====================================================================
 */

interface ProductContext {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number | string;
  inStock: boolean;
  description: string;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly MAX_HISTORY_MESSAGES = 10;

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Lấy hoặc tạo session chat
   */
  async getOrCreateSession(userId?: string, guestId?: string) {
    if (userId) {
      // Tìm session của logged-in user
      let session = await this.prisma.aiChatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!session) {
        session = await this.prisma.aiChatSession.create({
          data: { userId },
        });
      }

      return session;
    }

    if (guestId) {
      // Tìm session của guest
      let session = await this.prisma.aiChatSession.findFirst({
        where: { guestId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!session) {
        session = await this.prisma.aiChatSession.create({
          data: { guestId },
        });
      }

      return session;
    }

    // Không có userId lẫn guestId -> tạo session mới
    return this.prisma.aiChatSession.create({
      data: {},
    });
  }

  /**
   * Tìm kiếm sản phẩm liên quan để làm context cho AI
   */
  async searchProductsForContext(
    query: string,
    limit = 5,
  ): Promise<ProductContext[]> {
    this.logger.log(`Searching products for query: "${query}"`);

    // [OPTIMIZATION] Extract keywords to search more broadly
    const keywords = query
      .toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(' ')
      .filter((word) => word.length > 2);

    this.logger.log(`Extracted keywords: [${keywords.join(', ')}]`);

    // Build the OR conditions carefully for Prisma
    const orConditions: any[] = [
      { name: { contains: query, mode: 'insensitive' } },
    ];

    keywords.forEach((kw) => {
      orConditions.push({ name: { contains: kw, mode: 'insensitive' } });
      orConditions.push({ description: { contains: kw, mode: 'insensitive' } });
      orConditions.push({
        category: { name: { contains: kw, mode: 'insensitive' } },
      });
    });

    const products = await this.prisma.product.findMany({
      where: {
        OR: orConditions,
        deletedAt: null,
      },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        skus: {
          where: { status: 'ACTIVE' },
          select: { price: true, stock: true },
          take: 1,
        },
      },
      take: limit,
    });

    this.logger.log(`Found ${products.length} products for context`);

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || 'Uncategorized',
      brand: p.brand?.name || 'No Brand',
      price: Number(p.skus[0]?.price) || 0,
      inStock: (p.skus[0]?.stock || 0) > 0,
      description: p.description?.substring(0, 200) || '',
    }));
  }

  /**
   * Build system prompt với context sản phẩm
   */
  buildSystemPrompt(productContext: ProductContext[]) {
    const productList =
      productContext.length > 0
        ? productContext
            .map(
              (p) =>
                `- ${p.name} (${p.category}): ${Number(p.price).toLocaleString('vi-VN')}đ ${p.inStock ? '✓ Còn hàng' : '✗ Hết hàng'}`,
            )
            .join('\n')
        : 'Không có sản phẩm phù hợp trong hệ thống (No products found).';

    const prompt = `Bạn là AI Assistant của Luxe Shop - một cửa hàng bán đồ nội thất và trang trí cao cấp.
Nhiệm vụ của bạn là tư vấn sản phẩm, giải đáp thắc mắc về chính sách và giúp khách hàng mua sắm.

DANH SÁCH SẢN PHẨM PHÙ HỢP CÓ TRONG DATABASE:
${productList}

CHÍNH SÁCH CỬA HÀNG:
- Miễn phí vận chuyển cho đơn hàng từ 500.000đ.
- Đổi trả miễn phí trong vòng 7 ngày nếu có lỗi.
- Thanh toán đa dạng: COD, Chuyển khoản, VNPay, MoMo.

HƯỚNG DẪN TRẢ LỜI:
1. Trả lời ngắn gọn, thân thiện và chuyên nghiệp bằng TIẾNG VIỆT.
2. Nếu DANH SÁCH SẢN PHẨM PHÙ HỢP ở trên có dữ liệu, hãy ưu tiên tư vấn các sản phẩm đó.
3. Nếu khách hỏi về các sản phẩm như "áo khoác", "giày dép", hãy khéo léo thông báo là shop chuyên về nội thất cao cấp (thảm, bàn, đèn...) và gợi ý họ xem các mẫu hiện có.
4. Định dạng giá tiền theo kiểu Việt Nam (ví dụ: 1.500.000đ).
5. Tuyệt đối không bịa đặt thông tin sản phẩm không có trong database.`;

    this.logger.debug(
      `Generated System Prompt with ${productContext.length} products`,
    );
    return prompt;
  }

  /**
   * Lấy lịch sử chat cho context
   */
  async getChatHistory(sessionId: string) {
    const messages = await this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: this.MAX_HISTORY_MESSAGES,
    });

    // Convert to Gemini format và reverse để đúng thứ tự
    const formattedHistory = messages.reverse().map((m) => ({
      role: m.role === AiChatRole.USER ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    // [FIX] Google Gemini requires the first message to be from 'user'
    // If pagination causes the first existing message to be from 'model', skip it.
    if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      formattedHistory.shift();
    }

    return formattedHistory;
  }

  /**
   * Gửi tin nhắn và nhận response từ AI
   */
  async sendMessage(
    message: string,
    userId?: string,
    guestId?: string,
  ): Promise<{ response: string; sessionId: string }> {
    if (!this.geminiService.isAvailable()) {
      return {
        response:
          'Xin lỗi, tính năng AI Chat hiện không khả dụng. Vui lòng thử lại sau hoặc liên hệ hotline: 1900-xxx-xxx',
        sessionId: '',
      };
    }

    // 1. Get/create session
    const session = await this.getOrCreateSession(userId, guestId);

    // 2. Save user message
    await this.prisma.aiChatMessage.create({
      data: {
        sessionId: session.id,
        role: AiChatRole.USER,
        content: message,
      },
    });

    // 3. Search products for context (RAG)
    const products = await this.searchProductsForContext(message);

    // 4. Build system prompt
    const systemPrompt = this.buildSystemPrompt(products);

    // 5. Get chat history
    const history = await this.getChatHistory(session.id);

    // 6. Generate AI response
    let aiResponse: string;
    try {
      aiResponse = await this.geminiService.generateResponse(
        message,
        systemPrompt,
        history.slice(0, -1), // Exclude the message we just added
      );
    } catch (error) {
      this.logger.error('AI response generation failed:', error);
      aiResponse = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }

    // 7. Save AI response
    await this.prisma.aiChatMessage.create({
      data: {
        sessionId: session.id,
        role: AiChatRole.ASSISTANT,
        content: aiResponse,
        metadata: {
          productIds: products.map((p) => p.id),
        },
      },
    });

    // 8. Update session timestamp
    await this.prisma.aiChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return {
      response: aiResponse,
      sessionId: session.id,
    };
  }

  /**
   * Lấy lịch sử chat của user (chỉ cho logged-in users)
   */
  async getHistory(userId: string, limit = 50) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!session) return [];

    return this.prisma.aiChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
