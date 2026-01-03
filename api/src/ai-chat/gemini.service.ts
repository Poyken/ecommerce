import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * =================================================================================================
 * GEMINI SERVICE - SERVICE KẾT NỐI VỚI GOOGLE GEMINI API
 * =================================================================================================
 *
 * 📚 TÀI LIỆU HƯỚNG DẪN CHO THỰC TẬP SINH (INTERN TRAINING):
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
 *
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
}
