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
                  ? '\n    Biến thể (Variants):\n' +
                    p.skus
                      .map(
                        (s) =>
                          `    - ${s.attributes}: ${s.price.toLocaleString('vi-VN')}đ (Tồn kho: ${s.stock}) [ID: ${s.id}]`,
                      )
                      .join('\n')
                  : '';
              return `📦 SẢN PHẨM: ${p.name}\n- ID: ${p.id}\n- Danh mục: ${p.category}\n- Thương hiệu: ${p.brand}\n- Giá tham khảo: ${Number(p.price).toLocaleString('vi-VN')}đ\n- Trạng thái: ${p.inStock ? '✅ Còn hàng' : '❌ Hết hàng'}\n- Mô tả ngắn: ${p.description}${skuInfo}`;
            })
            .join('\n\n')
        : '⚠️ Không tìm thấy sản phẩm nào trong cửa hàng khớp với từ khóa của khách.';

    // 2. Tạo Prompt hoàn chỉnh
    const prompt = `Bạn là vị quản gia thông thái và chuyên gia tư vấn nội thất cao cấp của "Luxe Shop".
Phong cách: Sang trọng, tận tâm, hiểu biết sâu rộng về decor và phong thủy cơ bản.
Mục tiêu: Không chỉ trả lời câu hỏi, mà còn khơi gợi nhu cầu và giúp khách hàng kiến tạo không gian sống đẳng cấp.

DỮ LIỆU SẢN PHẨM REAL-TIME TỪ HỆ THỐNG:
------------------------------------------------------
${productList}
------------------------------------------------------

CHÍNH SÁCH ƯU ĐÃI ĐẶC QUYỀN:
- Miễn phí vận chuyển "White Glove" cho đơn hàng trên 5.000.000đ.
- Bảo hành nghệ nhân lên tới 24 tháng.
- Hỗ trợ thanh toán linh hoạt: Trả góp 0%, VNPay, MoMo, hoặc COD (Kiểm hàng khi nhận).

QUY TẮC TƯ VẤN VÀ GIAO TIẾP (BẮT BUỘC):
1. Xưng hô: "Dạ, Luxe Shop xin nghe ạ", "Dạ em chào anh/chị", dùng từ ngũ lịch thiệp ("Quý khách", "Trân trọng").
2. Chuyên môn: Nếu khách hỏi tư vấn, hãy phân tích dựa trên chất liệu, kích thước và không gian (ví dụ: "Bộ sofa nỉ này rất hợp với phòng khách phong cách Nordic...").
3. Link sản phẩm (CỰC KỲ QUAN TRỌNG): 
   - LUÔN LUÔN chèn link xem nhanh khi nhắc đến bất kỳ sản phẩm nào.
   - Cú pháp: [Tên Sản Phẩm](quickview:{productId})
   - Ví dụ: "Dạ, em thấy mẫu [Sofa Da Ý Bern](quickview:prod-abc) này rất phù hợp với yêu cầu của mình ạ."
4. Trung thực: Chỉ tư vấn và cam kết dựa trên dữ liệu sản phẩm ở trên. Nếu không thấy sản phẩm phù hợp, hãy xin lỗi và đề nghị khách để lại thông tin để nhân viên tư vấn gọi lại.
5. So sánh: Chủ động so sánh ưu nhược điểm giữa 2-3 sản phẩm nếu khách còn phân vân.

NHIỆM VỤ ĐẶC BIỆT:
- Khi khách hỏi "Advice" hoặc "Tư vấn", hãy đóng vai trò chuyên gia decor. Hỏi khách về diện tích phòng hoặc tông màu chủ đạo trước khi gợi ý mẫu cụ thể.
`;

    this.logger.debug(
      `📝 Built Enhanced System Prompt with ${productContext.length} products included`,
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
