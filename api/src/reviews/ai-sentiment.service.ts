/**
 * =====================================================================
 * AI SENTIMENT SERVICE - PHÂN TÍCH CẢM XÚC ĐÁNH GIÁ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này sử dụng Google Gemini AI để:
 * 1. Phân tích sentiment (cảm xúc) của review
 * 2. Tự động gắn tags cho review
 * 3. Phát hiện review spam/toxic
 *
 * CÁCH HOẠT ĐỘNG:
 * - Khi có review mới -> Gọi AI phân tích
 * - AI trả về: sentiment, tags
 * - Lưu kết quả vào review.sentiment và review.autoTags
 *
 * =====================================================================
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '@core/prisma/prisma.service';
import { Sentiment } from '@prisma/client';

// AI Analysis result
export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1 to 1 (for internal use)
  confidence: number; // 0 to 1
  tags: string[];
  summary: string;
  isSpam: boolean;
  isToxic: boolean;
  keywords: string[];
}

const DEFAULT_SENTIMENT: SentimentResult = {
  sentiment: 'NEUTRAL',
  score: 0,
  confidence: 0,
  tags: [],
  summary: '',
  isSpam: false,
  isToxic: false,
  keywords: [],
};

@Injectable()
export class AiSentimentService implements OnModuleInit {
  private readonly logger = new Logger(AiSentimentService.name);
  private apiKey: string | undefined;
  private isEnabled: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.isEnabled = !!this.apiKey;

    if (this.isEnabled) {
      this.logger.log('AI Sentiment Service initialized with Gemini');
    } else {
      this.logger.warn('AI Sentiment Service disabled: GEMINI_API_KEY not set');
    }
  }

  /**
   * Check if AI is enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Phân tích sentiment của một review
   */
  async analyzeReview(
    reviewId: string,
    content: string,
    rating: number,
  ): Promise<SentimentResult> {
    if (!this.isEnabled || !content?.trim()) {
      // Fallback to rating-based sentiment
      return this.fallbackSentiment(rating);
    }

    try {
      const prompt = this.buildPrompt(content, rating);
      const result = await this.callGeminiApi(prompt);

      // Parse và validate response
      const sentimentResult = this.parseAiResponse(result, rating);

      // Lưu kết quả vào database
      await this.saveAnalysisResult(reviewId, sentimentResult);

      this.logger.log(
        `Analyzed review ${reviewId}: ${sentimentResult.sentiment}`,
      );
      return sentimentResult;
    } catch (error) {
      this.logger.error(
        `Failed to analyze review ${reviewId}: ${error.message}`,
      );
      const fallback = this.fallbackSentiment(rating);
      await this.saveAnalysisResult(reviewId, fallback);
      return fallback;
    }
  }

  /**
   * Phân tích hàng loạt reviews (Background job)
   */
  async analyzeMultipleReviews(
    reviewIds: string[],
  ): Promise<Record<string, SentimentResult>> {
    const results: Record<string, SentimentResult> = {};

    for (const id of reviewIds) {
      try {
        const review = await this.prisma.review.findUnique({
          where: { id },
          select: { id: true, content: true, rating: true },
        });

        if (review?.content) {
          results[id] = await this.analyzeReview(
            id,
            review.content,
            review.rating,
          );
          // Rate limiting: wait 500ms between calls
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        this.logger.error(`Failed to analyze review ${id}`);
        results[id] = DEFAULT_SENTIMENT;
      }
    }

    return results;
  }

  /**
   * Lấy reviews chưa được phân tích (để chạy batch job)
   */
  async getUnanalyzedReviews(limit: number = 50) {
    return this.prisma.review.findMany({
      where: {
        sentiment: null,
        content: { not: null },
      },
      select: { id: true, content: true, rating: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Thống kê sentiment cho một sản phẩm
   */
  async getProductSentimentStats(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true, sentiment: { not: null } },
      select: { sentiment: true, rating: true },
    });

    const total = reviews.length;
    if (total === 0) {
      return {
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        positivePercent: 0,
        neutralPercent: 0,
        negativePercent: 0,
      };
    }

    const positive = reviews.filter((r) => r.sentiment === 'POSITIVE').length;
    const neutral = reviews.filter((r) => r.sentiment === 'NEUTRAL').length;
    const negative = reviews.filter((r) => r.sentiment === 'NEGATIVE').length;

    return {
      total,
      positive,
      neutral,
      negative,
      positivePercent: Math.round((positive / total) * 100),
      neutralPercent: Math.round((neutral / total) * 100),
      negativePercent: Math.round((negative / total) * 100),
    };
  }

  /**
   * Lấy top tags của sản phẩm
   */
  async getProductTopTags(productId: string, limit: number = 10) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { autoTags: true },
    });

    // Count tags
    const tagCounts: Record<string, number> = {};
    reviews.forEach((review) => {
      review.autoTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  }

  /**
   * Build prompt cho Gemini AI
   */
  private buildPrompt(content: string, rating: number): string {
    return `Analyze this product review in Vietnamese or English. Return a JSON response.

Review: "${content}"
Rating: ${rating}/5 stars

Return JSON with:
1. sentiment: "POSITIVE", "NEUTRAL", or "NEGATIVE" (considering both content and rating)
2. score: number from -1 (very negative) to 1 (very positive)
3. confidence: number 0-1 for how confident you are
4. tags: array of relevant tags from: ["quality", "shipping", "service", "price", "packaging", "size", "color", "durability", "value", "fast_delivery", "slow_delivery", "damaged", "fake", "recommend", "not_recommend"]
5. summary: 1 sentence summary (same language as review)
6. isSpam: boolean if looks like spam/fake
7. isToxic: boolean if contains offensive language
8. keywords: 3-5 key phrases from review

Return ONLY valid JSON.`;
  }

  /**
   * Gọi Gemini API
   */
  private async callGeminiApi(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Parse và validate AI response
   */
  private parseAiResponse(
    responseText: string,
    rating: number,
  ): SentimentResult {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate và normalize
      const sentiment = this.normalizeSentiment(parsed.sentiment, rating);
      const score = this.normalizeScore(parsed.score, rating);

      return {
        sentiment,
        score,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
        summary:
          typeof parsed.summary === 'string'
            ? parsed.summary.slice(0, 500)
            : '',
        isSpam: Boolean(parsed.isSpam),
        isToxic: Boolean(parsed.isToxic),
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.slice(0, 5)
          : [],
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      return this.fallbackSentiment(rating);
    }
  }

  /**
   * Normalize sentiment
   */
  private normalizeSentiment(aiSentiment: string, rating: number): Sentiment {
    const valid: Sentiment[] = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
    if (valid.includes(aiSentiment as Sentiment)) {
      return aiSentiment as Sentiment;
    }

    // Fallback based on rating
    if (rating >= 4) return 'POSITIVE';
    if (rating >= 3) return 'NEUTRAL';
    return 'NEGATIVE';
  }

  /**
   * Normalize score
   */
  private normalizeScore(aiScore: number, rating: number): number {
    if (typeof aiScore === 'number' && aiScore >= -1 && aiScore <= 1) {
      return aiScore;
    }
    return (rating - 3) / 2; // 1->-1, 3->0, 5->1
  }

  /**
   * Fallback sentiment khi AI fail
   */
  private fallbackSentiment(rating: number): SentimentResult {
    let sentiment: Sentiment;
    if (rating >= 4) sentiment = 'POSITIVE';
    else if (rating >= 3) sentiment = 'NEUTRAL';
    else sentiment = 'NEGATIVE';

    return {
      sentiment,
      score: (rating - 3) / 2,
      confidence: 0.3,
      tags: [],
      summary: '',
      isSpam: false,
      isToxic: false,
      keywords: [],
    };
  }

  /**
   * Lưu kết quả phân tích vào database
   */
  private async saveAnalysisResult(reviewId: string, result: SentimentResult) {
    try {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          sentiment: result.sentiment,
          autoTags: result.tags,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save sentiment for review ${reviewId}`);
    }
  }

  /**
   * Tạo insights từ nhiều reviews (cho Product Dashboard)
   */
  async generateProductInsights(productId: string): Promise<string | null> {
    if (!this.isEnabled) return null;

    try {
      const reviews = await this.prisma.review.findMany({
        where: { productId, isApproved: true },
        select: { content: true, rating: true, sentiment: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      if (reviews.length < 3) return null;

      const reviewSummary = reviews
        .map(
          (r, i) =>
            `${i + 1}. [${r.rating}★/${r.sentiment || 'N/A'}] ${r.content?.slice(0, 150)}`,
        )
        .join('\n');

      const prompt = `Based on these product reviews, provide brief analysis (2-3 sentences) in Vietnamese:
1. Main strengths
2. Areas to improve
3. Overall satisfaction

Reviews:
${reviewSummary}

Be concise and actionable.`;

      const response = await this.callGeminiApi(prompt);
      return response.slice(0, 1000);
    } catch (error) {
      this.logger.error(`Failed to generate insights for product ${productId}`);
      return null;
    }
  }
}
