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
      const modelName = 'gemini-2.0-flash'; // Stable available model
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
      this.logger.debug(
        `Generating response. Prompt length: ${prompt.length}, History items: ${history.length}`,
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
      this.logger.debug(
        `Generating streaming response. Prompt length: ${prompt.length}, History items: ${history.length}`,
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

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
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
