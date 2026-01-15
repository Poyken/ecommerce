import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * =================================================================================================
 * GEMINI SERVICE - SERVICE KẾT NỐI VỚI GOOGLE GEMINI API
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH CỦA SERVICE NÀY:
 *    - Service này đóng vai trò là "Cầu nối" (Wrapper/Adapter) giữa Backend của chúng ta và Google Gemini API.
 *    - Nó chịu trách nhiệm gửi tin nhắn của user lên Google và nhận câu trả lời về.
 *    - Xử lý các logic phụ trợ: Authentication (API Key), Error Handling, Logging.
 *
 * 2. CÁC KHÁI NIỆM QUAN TRỌNG (KEY CONCEPTS):
 *
 *    A. MODEL (MÔ HÌNH):
 *       - Chúng ta đang sử dụng `gemini-2.0-flash`.
 *       - "Flash" nghĩa là phiên bản được tối ưu cho tốc độ phản hồi nhanh (Low Latency),
 *         rất phù hợp cho tính năng Chatbot Real-time.
 *       - Nếu cần xử lý phức tạp hơn (VD: Phân tích ảnh, logic suy luận sâu), có thể đổi sang `gemini-1.5-pro`.
 *
 *    B. STREAMING RESPONSE (PHẢN HỒI DẠNG DÒNG CHẢY):
 *       - Non-Streaming: Chờ AI nghĩ xong TẤT CẢ mới trả về 1 cục văn bản. (User phải chờ lâu).
 *       - Streaming: AI nghĩ được chữ nào trả về chữ đó ngay lập tức. (Giống hiệu ứng gõ chữ của ChatGPT).
 *       - Lợi ích: Tăng trải nghiệm người dùng (UX) vì cảm giác phản hồi tức thì.
 *
 *    C. SYSTEM PROMPT (HƯỚNG DẪN HỆ THỐNG):
 *       - Đây là "bản thiết kế nhân cách" cho AI.
 *       - Trước khi chat, ta "nhồi" (inject) vào đầu AI các quy tắc: "Bạn là nhân viên bán hàng",
 *         "Sản phẩm A giá 10k", "Không được nói bậy"...
 *       - `role: 'system'`: Đánh dấu đây là chỉ thị tối cao, không phải tin nhắn chat thông thường.
 *
 *    D. HISTORY (LỊCH SỬ CHAT):
 *       - AI không có bộ nhớ dài hạn tự động (Stateless).
 *       - Mỗi lần gửi tin nhắn mới, ta phải gửi KÈM THEO toàn bộ nội dung chat trước đó
 *         để AI hiểu ngữ cảnh (Context).
 *
 * 3. CONFIGURATION (CẤU HÌNH SÁNG TẠO):
 *    - `temperature` (0.0 - 2.0): Độ "phiêu" của AI. Thấp (0.2) thì trả lời chính xác, máy móc. Cao (0.9) thì sáng tạo, văn hoa.
 *    - `topP` (0.0 - 1.0): Độ đa dạng từ vựng.
 *    - `maxOutputTokens`: Giới hạn độ dài câu trả lời để tránh spam hoặc tốn tiền.
 * *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =================================================================================================
 */

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private genAI: GoogleGenerativeAI | null = null;

  private model: GenerativeModel | null = null;

  constructor(private configService: ConfigService) {
    // 1. Lấy API Key từ biến môi trường (File .env)
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey) {
      // 2. Khởi tạo Client kết nối với Google AI
      this.genAI = new GoogleGenerativeAI(apiKey);

      // 3. Chọn Model cụ thể để sử dụng
      // 'gemini-2.0-flash' là phiên bản mới nhất, cân bằng tốt giữa tốc độ và chi phí
      const modelName = 'gemini-2.0-flash';

      this.model = this.genAI.getGenerativeModel({
        model: modelName,
      });

      this.logger.log(
        `✅ Gemini AI initialized successfully with model: ${modelName}`,
      );
      this.logger.log(`🔑 API Key loaded: ${apiKey.substring(0, 5)}...******`);
    } else {
      this.logger.warn(
        '⚠️ GEMINI_API_KEY not found in .env. AI Chat feature will be DISABLED.',
      );
    }
  }

  /**
   * Kiểm tra Health Check: Xem service có sẵn sàng để sử dụng không.
   * Thường dùng để disable nút Chat ở Frontend nếu Backend chưa cấu hình xong.
   */
  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * 🟢 PHƯƠNG THỨC 1: GENERATE RESPONSE (Cơ bản)
   * - Cách hoạt động: Gửi prompt -> Chờ AI nghĩ xong -> Trả về toàn bộ câu trả lời.
   * - Ưu điểm: Đơn giản, dễ xử lý logic (dễ lưu vào Database).
   * - Nhược điểm: User phải chờ lâu nếu câu trả lời dài.
   *
   * @param prompt - Câu hỏi/Tin nhắn hiện tại của user.
   * @param systemPrompt - Ngữ cảnh hệ thống (Danh sách sản phẩm, quy tắc ứng xử...).
   * @param history - Mảng chứa các tin nhắn cũ để AI nhớ được mình đang nói chuyện gì.
   */
  async generateResponse(
    prompt: string,
    systemPrompt: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  ): Promise<string> {
    if (!this.model) {
      throw new Error('❌ Gemini AI is not configured. Please check API Key.');
    }

    try {
      this.logger.debug(
        `🚀 Generating response... Prompt length: ${prompt.length} chars, History: ${history.length} msgs`,
      );

      // Khởi tạo phiên Chat với cấu hình cụ thể
      const chat = this.model.startChat({
        history, // Nạp lại lịch sử chat cũ
        systemInstruction: {
          role: 'system', // Định danh đây là System Prompt
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          maxOutputTokens: 1024, // Giới hạn độ dài output (~700 từ tiếng Việt)
          temperature: 0.7, // 0.7 là mức cân bằng: đủ sáng tạo nhưng vẫn bám sát thực tế
          topP: 0.9, // Lấy mẫu top 90% xác suất token tiếp theo
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      this.logger.error('Gemini API error occurred');
      if (error && typeof error === 'object') {
        this.logger.error(`Error message: ${error.message || 'No message'}`);
        if (error.stack) this.logger.error(`Stack trace: ${error.stack}`);

        // Safe logging of error properties
        try {
          const detail = JSON.stringify(error);
          this.logger.error(
            `Error detail (safe): ${detail.substring(0, 1000)}`,
          );
        } catch (e) {
          this.logger.error('Could not stringify error object');
        }
      } else {
        this.logger.error(`Error: ${String(error)}`);
      }
      throw error;
    }
  }

  /**
   * 🟢 PHƯƠNG THỨC 2: GENERATE STREAMING RESPONSE (Nâng cao)
   * - Cách hoạt động: Gửi prompt -> AI trả về từng "chunk" (mẩu tin) ngay khi nghĩ ra -> Frontend hiển thị dần.
   * - Ưu điểm: Trải nghiệm người dùng (UX) cực tốt, cảm giác "thực" hơn.
   * - Nhược điểm: Phức tạp hơn để xử lý ở cả Backend và Frontend (cần WebSocket hoặc SSE).
   *
   * @param onChunk - Hàm callback: Mỗi khi có 1 mẩu tin mới, hàm này sẽ được gọi để bắn data về client ngay lập tức.
   */
  async generateStreamingResponse(
    prompt: string,
    systemPrompt: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    if (!this.model) {
      throw new Error('❌ Gemini AI is not configured');
    }

    try {
      this.logger.debug(
        `🚀 Starting Stream... Prompt length: ${prompt.length}, History: ${history.length}`,
      );

      const chat = this.model.startChat({
        history,
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      const result = await chat.sendMessageStream(prompt);
      let fullResponse = '';

      // Vòng lặp này sẽ chạy LIÊN TỤC mỗi khi AI "nhả" ra một đoạn text mới
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;

        // Gọi callback để đẩy dữ liệu về Client ngay lập tức
        onChunk(chunkText);
      }

      return fullResponse;
    } catch (error: any) {
      this.logger.error('Gemini streaming error occurred');
      if (error && typeof error === 'object') {
        this.logger.error(`Error message: ${error.message || 'No message'}`);
      } else {
        this.logger.error(`Error: ${String(error)}`);
      }
      throw error;
    }
  }

  /**
   * 🤖 AUTOMATION BOT: GENERATE PRODUCT CONTENT
   * - Tự động tạo mô tả sản phẩm và SEO Metadata dựa trên tên và thông tin cơ bản.
   * - Output dạng JSON để dễ dàng parse và điền vào form.
   */
  async generateProductContent(
    productName: string,
    categoryName: string,
    brandName?: string,
    features: string[] = [],
  ): Promise<{
    description: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }> {
    if (!this.model) {
      throw new Error('❌ Gemini AI is not configured');
    }

    const systemPrompt = `
    You are an expert E-commerce Copywriter and SEO Specialist.
    Your task is to generate compelling product descriptions and SEO metadata.
    
    OUTPUT FORMAT:
    You must return a valid JSON object ONLY. Do not include any markdown formatting like \`\`\`json.
    Structure:
    {
      "description": "HTML formatted detailed product description...",
      "metaTitle": "SEO optimization title (max 60 chars)",
      "metaDescription": "SEO optimization description (max 160 chars)",
      "metaKeywords": "comma separated keywords"
    }

    GUIDELINES:
    1. Description should be professional, engaging, and highlight key benefits. Use HTML tags (<p>, <ul>, <li>, <strong>) for formatting.
    2. Meta Title should be catchy and include main keywords.
    3. Meta Description should encourage clicks.
    4. Language: VIETNAMESE (Tiếng Việt) unless the input suggests otherwise.
    `;

    const userPrompt = `
    Product Name: ${productName}
    Category: ${categoryName}
    Brand: ${brandName || 'Generic'}
    Key Features: ${features.join(', ')}
    `;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json', // Force JSON output
        },
      });

      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      this.logger.error('Error generating product content', error);
      // Fallback
      return {
        description: `${productName} in ${categoryName}`,
        metaTitle: productName,
        metaDescription: `Buy ${productName} now`,
        metaKeywords: `${productName}, ${categoryName}`,
      };
    }
  }

  /**
   * 🤖 AUTOMATION BOT: TRANSLATE TEXT
   * - Dịch văn bản sang ngôn ngữ đích.
   */
  async translateText(text: string, targetLocale: string): Promise<string> {
    if (!this.model) {
      throw new Error('❌ Gemini AI is not configured');
    }

    const systemPrompt = `
    You are a professional Translator suitable for E-commerce context.
    Translate the input text to the target locale code: "${targetLocale}".
    Maintain the tone, formatting (HTML tags if any), and meaning.
    Return ONLY the translated text.
    `;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: text }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      });

      return result.response.text();
    } catch (error) {
      this.logger.error('Error translating text', error);
      // Fallback: return original text
      return text;
    }
  }

  async analyzeSubscription(
    tenantName: string,
    plan: string,
    usageDurationDays: number,
    status: string,
  ): Promise<string> {
    if (!this.model) {
      return 'Dữ liệu đang được phân tích...';
    }
    const prompt = `
    Analyze this SaaS subscription:
    Tenant: ${tenantName}
    Plan: ${plan}
    Duration: ${usageDurationDays} days
    Status: ${status}

    Provide a short, 1-sentence business insight or recommendation (e.g., "Upgrade candidate", "Churn risk"). 
    Keep it professional and concise.
    `;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (error) {
      this.logger.error('Error analyzing subscription', error);
      return 'Dữ liệu đang được phân tích...';
    }
  }

  async analyzeReviewSentiment(text: string): Promise<{
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    tags: string[];
  }> {
    if (!this.model) {
      return { sentiment: 'NEUTRAL', tags: [] };
    }

    const prompt = `
    Analyze the sentiment of this e-commerce product review:
    "${text}"

    Determine if it is POSITIVE, NEGATIVE, or NEUTRAL.
    Also extract up to 3 short tags (2-3 words, lowercase, underscores) describing the main topics (e.g., "fast_shipping", "poor_quality", "great_service").
    
    Return pure JSON format:
    {
      "sentiment": "POSITIVE", // or NEGATIVE, NEUTRAL
      "tags": ["tag1", "tag2"]
    }
    `;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const responseText = result.response.text();
      // Clean up markdown code blocks if present
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Error analyzing review sentiment', error);
      // Fallback
      return { sentiment: 'NEUTRAL', tags: [] };
    }
  }

  /**
   * Generate vector embedding for text using Gemini Embedding Model.
   * Used for semantic search.
   * @param text - Text to embed (e.g., product name + description)
   * @returns Array of 768 float numbers
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      this.logger.warn('GenAI not initialized. Using fallback zero vector.');
      return new Array(768).fill(0);
    }

    try {
      // Use the text-embedding-004 model (768 dimensions, free tier)
      const embeddingModel = this.genAI.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error('Error generating embedding', error);
      // Fallback: return a zero vector of 768 dimensions
      return new Array(768).fill(0);
    }
  }

  // =============================================================================
  // PILLAR 1: CONTENT AUTOMATION (MAGIC WRITE)
  // =============================================================================

  /**
   * Magic Write - Tự động tạo mô tả sản phẩm chuẩn SEO
   * @param productName - Tên sản phẩm
   * @param features - Danh sách tính năng/đặc điểm
   * @param category - Danh mục sản phẩm (optional)
   * @param brand - Thương hiệu (optional)
   */
  async generateMagicContent(
    productName: string,
    features: string[] = [],
    category?: string,
    brand?: string,
  ): Promise<{
    description: string;
    metaTitle: string;
    metaDescription: string;
    hashtags: string[];
    shortDescription: string;
  }> {
    if (!this.model) {
      this.logger.warn('Gemini model not initialized. Using fallback.');
      return {
        description: `${productName} - Sản phẩm chất lượng cao`,
        shortDescription: productName,
        metaTitle: productName,
        metaDescription: `Mua ${productName} giá tốt nhất`,
        hashtags: [],
      };
    }

    const featuresList = features.map((f) => `- ${f}`).join('\n');
    const categoryInfo = category ? `Danh mục: ${category}` : '';
    const brandInfo = brand ? `Thương hiệu: ${brand}` : '';

    const prompt = `
Bạn là chuyên gia viết nội dung SEO cho e-commerce. Hãy tạo nội dung marketing cho sản phẩm sau:

TÊN SẢN PHẨM: ${productName}
${categoryInfo}
${brandInfo}

TÍNH NĂNG/ĐẶC ĐIỂM:
${featuresList}

Hãy trả về JSON với cấu trúc sau (KHÔNG có markdown, CHỈ JSON thuần):
{
  "description": "Mô tả chi tiết sản phẩm (200-300 từ), chuẩn SEO, hấp dẫn, có bullet points cho tính năng chính",
  "shortDescription": "Tóm tắt ngắn gọn (50-70 từ) để hiển thị trong danh sách sản phẩm",
  "metaTitle": "Tiêu đề SEO (tối đa 60 ký tự, bao gồm từ khóa chính)",
  "metaDescription": "Mô tả meta SEO (tối đa 155 ký tự, kêu gọi click)",
  "hashtags": ["array", "of", "5-8", "relevant", "hashtags", "viết liền không dấu"]
}

Lưu ý:
- Viết bằng tiếng Việt, tự nhiên, thuyết phục
- Nhấn mạnh lợi ích cho khách hàng (benefit-focused)
- Sử dụng từ khóa phù hợp để SEO
- Hashtags phải liên quan đến sản phẩm, viết liền không dấu
`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Error generating product content', error);
      // Fallback
      return {
        description: `${productName} - Sản phẩm chất lượng cao`,
        shortDescription: productName,
        metaTitle: productName,
        metaDescription: `Mua ${productName} giá tốt nhất`,
        hashtags: [],
      };
    }
  }

  // =============================================================================
  // PILLAR 2: ACTIONABLE INSIGHTS
  // =============================================================================

  /**
   * Phân tích dữ liệu kinh doanh và đưa ra gợi ý hành động
   * @param businessData - Dữ liệu kinh doanh tổng hợp
   */
  async generateBusinessInsights(businessData: {
    todayRevenue: number;
    yesterdayRevenue: number;
    weekRevenue: number;
    lastWeekRevenue: number;
    topViewedProducts: { name: string; views: number; stock: number }[];
    lowStockProducts: { name: string; stock: number }[];
    pendingOrders: number;
    totalCustomers: number;
    newCustomersToday: number;
  }): Promise<{
    insights: {
      type: 'warning' | 'success' | 'info';
      title: string;
      message: string;
      action?: string;
    }[];
    summary: string;
  }> {
    if (!this.model) {
      this.logger.warn('Gemini model not initialized. Using fallback.');
      return {
        insights: [
          {
            type: 'info',
            title: 'Không thể phân tích',
            message: 'AI chưa được cấu hình. Vui lòng kiểm tra API Key.',
          },
        ],
        summary: 'Đang đợi dữ liệu phân tích...',
      };
    }

    const prompt = `
Bạn là cố vấn kinh doanh AI cho một shop e-commerce. Phân tích dữ liệu sau và đưa ra TỐI ĐA 4 insights quan trọng nhất:

=== DỮ LIỆU KINH DOANH ===
Doanh thu hôm nay: ${(businessData?.todayRevenue || 0).toLocaleString('vi-VN')} VNĐ
Doanh thu hôm qua: ${(businessData?.yesterdayRevenue || 0).toLocaleString('vi-VN')} VNĐ
Doanh thu tuần này: ${(businessData?.weekRevenue || 0).toLocaleString('vi-VN')} VNĐ
Doanh thu tuần trước: ${(businessData?.lastWeekRevenue || 0).toLocaleString('vi-VN')} VNĐ

Sản phẩm được xem nhiều nhất (và tồn kho):
${(businessData?.topViewedProducts || []).map((p) => `- ${p.name}: ${p.views} lượt xem, còn ${p.stock} sản phẩm`).join('\n')}

Sản phẩm sắp hết hàng:
${(businessData?.lowStockProducts || []).map((p) => `- ${p.name}: còn ${p.stock}`).join('\n')}

Đơn hàng chờ xử lý: ${businessData?.pendingOrders || 0}
Tổng khách hàng: ${businessData?.totalCustomers || 0}
Khách mới hôm nay: ${businessData?.newCustomersToday || 0}

=== YÊU CẦU ===
Trả về JSON (KHÔNG markdown):
{
  "insights": [
    {
      "type": "warning|success|info",
      "title": "Tiêu đề ngắn gọn",
      "message": "Giải thích chi tiết vấn đề/cơ hội",
      "action": "Hành động cụ thể cần làm ngay"
    }
  ],
  "summary": "Tóm tắt 1-2 câu về tình hình kinh doanh hôm nay"
}

Ưu tiên:
1. Cảnh báo khẩn cấp (warning): Sản phẩm hot sắp hết, đơn hàng chờ quá lâu
2. Thành công (success): Doanh thu tăng, sản phẩm bán chạy
3. Thông tin (info): Gợi ý cải thiện, xu hướng
`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Error generating business insights', error);
      return {
        insights: [
          {
            type: 'info',
            title: 'Không thể phân tích',
            message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
          },
        ],
        summary: 'Đang cập nhật dữ liệu...',
      };
    }
  }

  // =============================================================================
  // PILLAR 5: SMART SUPPORT (RAG CHATBOT)
  // =============================================================================

  /**
   * Trả lời câu hỏi khách hàng dựa trên context (RAG)
   * @param question - Câu hỏi của khách
   * @param context - Thông tin liên quan (sản phẩm, chính sách...)
   * @param shopName - Tên shop để cá nhân hóa
   */
  async answerWithContext(
    question: string,
    context: string,
    shopName: string,
  ): Promise<string> {
    if (!this.model) {
      this.logger.warn('Gemini model not initialized. Using fallback.');
      return 'Dạ em xin lỗi, hệ thống AI đang tạm nghỉ để bảo trì. Anh/chị vui lòng quay lại sau hoặc gọi hotline shop nhé! 🙏';
    }

    const prompt = `
Bạn là nhân viên chăm sóc khách hàng của shop "${shopName}".
Hãy trả lời câu hỏi của khách dựa trên thông tin được cung cấp.

=== THÔNG TIN CỦA SHOP ===
${context}

=== CÂU HỎI CỦA KHÁCH ===
${question}

=== QUY TẮC ===
1. Trả lời ngắn gọn, thân thiện, chuyên nghiệp
2. CHỈ sử dụng thông tin được cung cấp, KHÔNG bịa đặt
3. Nếu không có thông tin, nói "Dạ em chưa có thông tin về vấn đề này, anh/chị vui lòng liên hệ hotline shop để được hỗ trợ ạ"
4. Luôn kết thúc bằng câu hỏi mở hoặc đề nghị hỗ trợ thêm
5. Sử dụng emoji phù hợp để tăng sự thân thiện
`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (error) {
      this.logger.error('Error answering with context', error);
      return 'Dạ em xin lỗi, hệ thống đang bận. Anh/chị vui lòng thử lại sau ạ! 🙏';
    }
  }
}
