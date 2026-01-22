/**
 * =====================================================================
 * AI AUTOMATION CONTROLLER - TỰ ĐỘNG HÓA NỘI DUNG (AI-ASSIST)
 * =====================================================================
 *
 * =====================================================================
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { GeminiService } from './gemini.service';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GenerateProductContentSchema = z.object({
  productName: z.string().min(1),
  categoryName: z.string().min(1),
  brandName: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export class GenerateProductContentDto extends createZodDto(
  GenerateProductContentSchema,
) {}

const TranslateTextSchema = z.object({
  text: z.string().min(1),
  targetLocale: z.string().min(1),
});

export class TranslateTextDto extends createZodDto(TranslateTextSchema) {}

@ApiTags('AI Automation')
@Controller('ai-automation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiAutomationController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate-product-content')
  @ApiOperation({ summary: 'Auto-generate product description & SEO metadata' })
  @ApiBody({ type: GenerateProductContentDto })
  async generateProductContent(@Body() dto: GenerateProductContentDto) {
    const result = await this.geminiService.generateProductContent(
      dto.productName,
      dto.categoryName,
      dto.brandName,
      dto.features,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('translate')
  @ApiOperation({ summary: 'Auto-translate text to target language' })
  @ApiBody({ type: TranslateTextDto })
  async translateText(@Body() dto: TranslateTextDto) {
    const translatedText = await this.geminiService.translateText(
      dto.text,
      dto.targetLocale,
    );
    return {
      success: true,
      data: {
        text: translatedText,
        locale: dto.targetLocale,
      },
    };
  }

  @Post('analyze-subscription')
  @ApiOperation({ summary: 'Analyze subscription health with AI' })
  async analyzeSubscription(
    @Body()
    body: {
      tenantName: string;
      plan: string;
      days: number;
      status: string;
    },
  ) {
    const result = await this.geminiService.analyzeSubscription(
      body.tenantName,
      body.plan,
      body.days,
      body.status,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('analyze-review-sentiment')
  @ApiOperation({ summary: 'Analyze review sentiment with AI' })
  async analyzeReviewSentiment(@Body() body: { text: string }) {
    const result = await this.geminiService.analyzeReviewSentiment(body.text);
    return {
      success: true,
      data: result,
    };
  }

  @Post('generate-embedding')
  @ApiOperation({
    summary: 'Generate vector embedding for text (Semantic Search)',
  })
  async generateEmbedding(@Body() body: { text: string }) {
    const result = await this.geminiService.generateEmbedding(body.text);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * PILLAR 1: Magic Write - Tạo nội dung sản phẩm chuẩn SEO
   */
  @Post('magic-write')
  @ApiOperation({ summary: 'Magic Write - Generate SEO content for product' })
  async magicWrite(
    @Body()
    body: {
      productName: string;
      features: string[];
      category?: string;
      brand?: string;
    },
  ) {
    const result = await this.geminiService.generateMagicContent(
      body.productName,
      body.features,
      body.category,
      body.brand,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * PILLAR 2: Business Insights - Phân tích kinh doanh
   */
  @Post('business-insights')
  @ApiOperation({ summary: 'Generate AI-powered business insights' })
  async businessInsights(
    @Body()
    body: {
      todayRevenue: number;
      yesterdayRevenue: number;
      weekRevenue: number;
      lastWeekRevenue: number;
      topViewedProducts: { name: string; views: number; stock: number }[];
      lowStockProducts: { name: string; stock: number }[];
      pendingOrders: number;
      totalCustomers: number;
      newCustomersToday: number;
    },
  ) {
    const result = await this.geminiService.generateBusinessInsights(body);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * PILLAR 5: RAG Answer - Trả lời khách hàng dựa trên context
   */
  @Post('rag-answer')
  @ApiOperation({ summary: 'Answer customer question with RAG context' })
  async ragAnswer(
    @Body()
    body: {
      question: string;
      context: string;
      shopName: string;
    },
  ) {
    const result = await this.geminiService.answerWithContext(
      body.question,
      body.context,
      body.shopName,
    );
    return {
      success: true,
      data: { answer: result },
    };
  }
}
