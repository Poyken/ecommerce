import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { AiChatRole } from '@prisma/client';
import { GeminiService } from './gemini.service';

/**
 * =================================================================================================
 * AI CHAT SERVICE - TRUNG TÂM XỬ LÝ LOGIC CHATBOT
 * =================================================================================================
 *
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUY TRÌNH HOẠT ĐỘNG (WORKFLOW):
 *    - Bước 1: Nhận tin nhắn từ User.
 *    - Bước 2: "Hiểu" tin nhắn -> Tìm kiếm sản phẩm liên quan trong Database (Kỹ thuật RAG).
 *    - Bước 3: Tạo "System Prompt" chứa thông tin sản phẩm vừa tìm được.
 *    - Bước 4: Gọi Gemini API với (System Prompt + Lịch sử Chat + Tin nhắn mới).
 *    - Bước 5: Lưu câu trả lời của AI vào Database và trả về cho User.
 *
 * 2. CÁC KHÁI NIỆM QUAN TRỌNG:
 *
 *    A. RAG (Retrieval Augmented Generation - Thế hệ tăng cường truy xuất):
 *       - Vấn đề: AI (Gemini) không hề biết gì về sản phẩm trong kho của ta.
 *       - Giải pháp: Trước khi hỏi AI, ta phải "lục lọi" (Retrieve) trong Database xem có sản phẩm nào
 *         khớp với câu hỏi của khách không, rồi "mớm" (Augment) thông tin đó cho AI.
 *       - Ví dụ: Khách hỏi "Có ghế sofa không?", ta tìm được "Sofa Da Bò, Sofa Nỉ".
 *         Ta bảo AI: "Hiện shop có Sofa Da Bò giá 5tr và Sofa Nỉ giá 3tr. Hãy trả lời khách đi."
 *
 *    B. SESSION (PHIÊN LÀM VIỆC):
 *       - Khách vãng lai (Guest): Dùng `guestId` (Lưu ở localStorage trình duyệt) để định danh.
 *       - Khách đã đăng nhập: Dùng `userId` thật sự.
 *       - Mục đích: Để lưu lại lịch sử chat, giúp AI nhớ được khách đã hỏi gì trước đó.
 *
 *    C. CONTEXT WINDOW (CỬA SỔ NGỮ CẢNH):
 *       - AI có giới hạn bộ nhớ (Token limit). Ta chỉ nên gửi kèm 10-20 tin nhắn gần nhất
 *         để tiết kiệm chi phí và đảm bảo tốc độ.
 * *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =================================================================================================
 */

interface ProductContext {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number | string;
  inStock: boolean;
  description: string;
  skus?: {
    id: string;
    code: string;
    price: number;
    stock: number;
    attributes: string;
  }[];
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
   * 🔍 QUẢN LÝ SESSION (PHIÊN CHAT)
   * Hàm này cực kỳ quan trọng để xác định "Ai đang chat?":
   * 1. Nếu có `userId` (đã login) -> Lấy session cũ của user đó hoặc tạo mới.
   * 2. Nếu có `guestId` (chưa login) -> Lấy session theo mã máy của họ.
   * 3. Nếu không có gì cả -> Tạo session ẩn danh (rất hiếm khi xảy ra).
   */
  async getOrCreateSession(userId?: string, guestId?: string) {
    this.logger.debug(
      `💼 getOrCreateSession: userId=${userId}, guestId=${guestId}`,
    );

    // TRƯỜNG HỢP 1: User đã đăng nhập
    if (userId) {
      let session = await this.prisma.aiChatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' }, // Lấy session mới nhất
      });

      if (!session) {
        this.logger.debug(`✨ Creating new session for User ${userId}`);
        session = await this.prisma.aiChatSession.create({
          data: { userId },
        });
      }
      return session;
    }

    // TRƯỜNG HỢP 2: Khách vãng lai (Guest)
    if (guestId) {
      let session = await this.prisma.aiChatSession.findFirst({
        where: { guestId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!session) {
        this.logger.debug(`👻 Creating new session for Guest ${guestId}`);
        session = await this.prisma.aiChatSession.create({
          data: { guestId },
        });
      }
      return session;
    }

    // TRƯỜNG HỢP 3: Fallback (Dự phòng)
    this.logger.debug('⚠️ No identity provided. Creating anonymous session.');
    return this.prisma.aiChatSession.create({
      data: {},
    });
  }

  /**
   * 🔎 TÌM KIẾM SẢN PHẨM (RAG CORE)
   * Đây là "trái tim" của tính năng tư vấn sản phẩm.
   * Thay vì dùng Vector Database (phức tạp), ta dùng Full-text Search đơn giản cho giai đoạn MVP.
   *
   * Cơ chế hoạt động:
   * 1. Phân tích câu hỏi: "Tôi muốn mua ghế sofa màu xanh" -> Keywords: "ghế", "sofa", "xanh".
   * 2. Tìm trong DB: Tìm sản phẩm có tên/mô tả chứa các từ khóa đó.
   * 3. Lấy thêm SKUs (biến thể): Để biết giá tiền chính xác và tồn kho.
   */
  async searchProductsForContext(
    query: string,
    limit = 5,
  ): Promise<ProductContext[]> {
    this.logger.log(`🔍 Searching products for: "${query}"`);

    // KEYWORD EXTRACTION: Tách từ khóa đơn giản
    // Loại bỏ dấu câu, chuyển về chữ thường
    const keywords = query
      .toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(' ')
      .filter((word) => word.length > 2); // Chỉ lấy từ > 2 ký tự

    this.logger.debug(`🔑 Keywords extracted: [${keywords.join(', ')}]`);

    // Xây dựng câu truy vấn OR (Tìm A hoặc B hoặc C)
    const orConditions: any[] = [
      { name: { contains: query, mode: 'insensitive' } }, // Tìm chính xác cả cụm
    ];

    keywords.forEach((kw) => {
      orConditions.push({ name: { contains: kw, mode: 'insensitive' } });
      orConditions.push({ description: { contains: kw, mode: 'insensitive' } });
      orConditions.push({
        categories: {
          some: { category: { name: { contains: kw, mode: 'insensitive' } } },
        },
      });
    });

    // Truy vấn Database
    const products = await this.prisma.product.findMany({
      where: {
        OR: orConditions,
        deletedAt: null, // Chỉ lấy sản phẩm chưa bị xóa
      },
      include: {
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
        brand: { select: { name: true } },
        skus: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            price: true,
            stock: true,
            skuCode: true,
            optionValues: {
              include: {
                optionValue: { include: { option: true } },
              },
            },
          },
          take: 5, // Lấy tối đa 5 biến thể để không làm System Prompt quá dài
        },
      },
      take: limit, // Giới hạn số lượng sản phẩm trả về
    });

    this.logger.log(`✅ Found ${products.length} matching products`);

    // Format dữ liệu gọn gàng để "mớm" cho AI
    return products.map((p) => {
      const mainSku = p.skus && p.skus.length > 0 ? p.skus[0] : null;
      return {
        id: p.id,
        name: p.name,
        category: p.categories[0]?.category.name || 'Uncategorized',
        brand: (p as any).brand?.name || 'No Brand',
        price: mainSku ? Number(mainSku.price) : 0,
        inStock: mainSku ? (mainSku.stock || 0) > 0 : false,
        description: p.description?.substring(0, 200) || '', // Cắt ngắn mô tả
        skus: p.skus.map((s) => ({
          id: s.id,
          code: s.skuCode,
          price: Number(s.price),
          stock: s.stock,
          attributes: s.optionValues
            .map(
              (ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`,
            )
            .join(', '),
        })),
      };
    });
  }

  /**
   * 📝 BUILD SYSTEM PROMPT (KỊCH BẢN AI)
   * Tại đây ta tổng hợp tất cả thông tin thành một "bản hướng dẫn chi tiết" cho AI.
   * Prompt càng rõ ràng, AI trả lời càng thông minh.
   */
  buildSystemPrompt(productContext: ProductContext[]) {
    // 1. Format danh sách sản phẩm thành text dễ đọc cho AI
    const productList =
      productContext.length > 0
        ? productContext
            .map((p) => {
              const skuInfo =
                p.skus && p.skus.length > 0
                  ? '\n    Variants:\n' +
                    p.skus
                      .map(
                        (s) =>
                          `    - ${s.attributes} (Giá: ${s.price.toLocaleString('vi-VN')}đ) [ID: ${s.id}]`,
                      )
                      .join('\n')
                  : '';
              return `- ${p.name} (ID: ${p.id}) - Model: ${p.category} | Giá gốc: ${Number(p.price).toLocaleString('vi-VN')}đ ${p.inStock ? '✅ Còn hàng' : '❌ Hết hàng'}${skuInfo}`;
            })
            .join('\n\n') // Xuống dòng kép để tách rõ các sản phẩm
        : '⚠️ Không tìm thấy sản phẩm nào trong cửa hàng khớp với từ khóa.';

    // 2. Tạo Prompt hoàn chỉnh
    const prompt = `Bạn là AI Assistant chuyên nghiệp của Luxe Shop - Cửa hàng nội thất cao cấp.
Nhiệm vụ: Tư vấn sản phẩm, giúp khách chốt đơn, giải đáp thắc mắc.

CONTEXT DỮ LIỆU SẢN PHẨM HIỆN CÓ (Real-time Database):
------------------------------------------------------
${productList}
------------------------------------------------------

CHÍNH SÁCH BÁN HÀNG CẦN NHỚ:
- Freeship đơn > 500k.
- Đổi trả 7 ngày.
- Hỗ trợ COD, VNPay, MoMo.

QUY TẮC TRẢ LỜI QUAN TRỌNG (BẮT BUỘC TUÂN THỦ):
1. Ngôn ngữ: Tiếng Việt, giọng văn lịch sự, thân thiện, như nhân viên tư vấn có tâm.
2. Nguồn dữ liệu: CHỈ tư vấn các sản phẩm có trong danh sách ở trên. Không bịa ra sản phẩm.
3. Link sản phẩm (QUAN TRỌNG): 
   - Khi nhắc đến tên sản phẩm, PHẢI chèn link xem nhanh để khách bấm vào mua ngay.
   - Cú pháp: [Tên Sản Phẩm](quickview:{productId})
   - Ví dụ chuẩn: "Bên em có mẫu [Sofa Da Bò Ý](quickview:prod-123) đang rất hot ạ."
4. Nếu khách hỏi thứ không bán (VD: Quần áo): Lịch sự từ chối và lái về nội thất.
5. Format giá: Dùng định dạng 1.500.000đ (có dấu chấm phân cách).
`;

    this.logger.debug(
      `📝 Built System Prompt with ${productContext.length} products included`,
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
   * 🚀 SEND MESSAGE (MAIN HANDLER)
   * Hàm xử lý chính khi User nhấn nút Send:
   * 1. Kiểm tra API Key.
   * 2. Lấy Session.
   * 3. Tìm sản phẩm liên quan (RAG).
   * 4. Gửi cho AI.
   * 5. Lưu kết quả.
   */
  async sendMessage(
    message: string,
    userId?: string,
    guestId?: string,
  ): Promise<{ response: string; sessionId: string }> {
    // 1. Health check
    if (!this.geminiService.isAvailable()) {
      return {
        response:
          '🔧 Hệ thống AI đang bảo trì. Vui lòng thử lại sau hoặc liên hệ Hotline.',
        sessionId: '',
      };
    }

    // 2. Get Session
    const session = await this.getOrCreateSession(userId, guestId);

    // 3. Save User Request
    await this.prisma.aiChatMessage.create({
      data: {
        sessionId: session.id,
        role: AiChatRole.USER,
        content: message,
      },
    });

    // 4. RAG Step: Tìm sản phẩm relevant
    const products = await this.searchProductsForContext(message);

    // 5. Build Final Prompt
    const systemPrompt = this.buildSystemPrompt(products);

    // 6. Get Context History
    const history = await this.getChatHistory(session.id);

    // 7. Call External AI Service
    let aiResponse: string;
    try {
      // slice(0, -1) để loại bỏ chính tin nhắn vừa add (vì Gemini API handle tin nhắn mới riêng)
      aiResponse = await this.geminiService.generateResponse(
        message,
        systemPrompt,
        history.slice(0, -1),
      );
    } catch (error) {
      this.logger.error('❌ AI Failed:', error);
      aiResponse = '😔 Xin lỗi, hệ thống đang quá tải. Bạn chờ một chút nhé.';
    }

    // 8. Save AI Response
    await this.prisma.aiChatMessage.create({
      data: {
        sessionId: session.id,
        role: AiChatRole.ASSISTANT,
        content: aiResponse,
        metadata: {
          productIds: products.map((p) => p.id), // Lưu lại ID các SP đã gợi ý để tracking
        },
      },
    });

    // 9. Update Session Timestamp (để sắp xếp conversation gần nhất)
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
