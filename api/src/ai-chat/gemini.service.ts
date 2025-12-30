import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * =====================================================================
 * GEMINI SERVICE - Kết nối với Google Gemini API
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GOOGLE GEMINI API:
 * - Gemini là AI model của Google, tương tự GPT của OpenAI.
 * - Gemini 1.5 Flash: Model nhanh, phù hợp cho chat real-time.
 * - Gemini 1.5 Pro: Model mạnh hơn, phù hợp cho task phức tạp.
 *
 * 2. STREAMING RESPONSE:
 * - Thay vì chờ toàn bộ response, ta nhận từng chunk text.
 * - Giúp UX mượt mà hơn (tin nhắn hiện dần như ChatGPT).
 *
 * 3. SYSTEM PROMPT:
 * - Đây là "nhân cách" của AI, quy định cách AI trả lời.
 * - Ta inject thông tin sản phẩm vào đây để AI "biết" về shop.
 * =====================================================================
 */

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      const modelName = 'gemini-flash-latest';
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
      });
      this.logger.log(`Gemini AI initialized with model: ${modelName}`);
      this.logger.log(`API Key loaded: ${apiKey.substring(0, 5)}...`);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not configured. AI Chat will be disabled.',
      );
    }
  }

  /**
   * Check xem Gemini đã được cấu hình chưa
   */
  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Tạo response từ Gemini (non-streaming)
   * @param prompt - Tin nhắn từ user
   * @param systemPrompt - Context và quy tắc cho AI
   * @param history - Lịch sử chat trước đó
   */
  async generateResponse(
    prompt: string,
    systemPrompt: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured');
    }

    try {
      const chat = this.model.startChat({
        history,
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7, // 0 = deterministic, 1 = creative
          topP: 0.9,
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Gemini API error keys:', Object.keys(error));
      this.logger.error('Gemini API error toString:', error.toString());
      if (error instanceof Error) {
        this.logger.error('Gemini API error message:', error.message);
        this.logger.error('Gemini API error stack:', error.stack);
      }
      this.logger.error(
        'Gemini API error json:',
        JSON.stringify(error, null, 2),
      );
      throw error;
    }
  }

  /**
   * Tạo response streaming (cho UX tốt hơn)
   * @param prompt - Tin nhắn từ user
   * @param systemPrompt - Context và quy tắc cho AI
   * @param history - Lịch sử chat trước đó
   * @param onChunk - Callback khi nhận được chunk text mới
   */
  async generateStreamingResponse(
    prompt: string,
    systemPrompt: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured');
    }

    try {
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

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onChunk(chunkText);
      }

      return fullResponse;
    } catch (error) {
      this.logger.error('Gemini streaming error keys:', Object.keys(error));
      this.logger.error('Gemini streaming error toString:', error.toString());
      if (error instanceof Error) {
        this.logger.error('Gemini streaming error message:', error.message);
      }
      this.logger.error(
        'Gemini streaming error json:',
        JSON.stringify(error, null, 2),
      );
      throw error;
    }
  }
}
