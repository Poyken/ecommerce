import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { GeminiService } from '@/ai/ai-chat/gemini.service';
import { RedisService } from '@core/redis/redis.service';

/**
 * =============================================================================
 * KNOWLEDGE SERVICE - QUẢN LÝ KNOWLEDGE BASE
 * =============================================================================
 *
 * =============================================================================
 */

export interface KnowledgeChunk {
  id: string;
  tenantId: string;
  type: 'product' | 'policy' | 'faq';
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly KNOWLEDGE_KEY_PREFIX = 'knowledge:tenant:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Index tất cả sản phẩm của tenant thành knowledge chunks
   */
  async indexProducts(tenantId: string): Promise<number> {
    this.logger.log(`Indexing products for tenant: ${tenantId}`);

    const products = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        skus: {
          where: { status: 'ACTIVE' },
          select: { price: true, salePrice: true, stock: true, skuCode: true },
        },
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    const chunks: KnowledgeChunk[] = [];

    for (const product of products) {
      const price = product.skus[0]?.salePrice || product.skus[0]?.price;
      const stock = product.skus.reduce((sum, s) => sum + s.stock, 0);

      const content = `
Sản phẩm: ${product.name}
Danh mục: ${product.categories[0]?.category.name || 'Chưa phân loại'}
Giá: ${price ? `${Number(price).toLocaleString('vi-VN')} VNĐ` : 'Liên hệ'}
Còn hàng: ${stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
Mô tả: ${product.description?.substring(0, 200) || 'Không có mô tả'}
`.trim();

      chunks.push({
        id: product.id,
        tenantId,
        type: 'product',
        content,
        metadata: {
          productId: product.id,
          name: product.name,
          price: price?.toString(),
          stock,
        },
      });
    }

    // Store in Redis (simple in-memory store)
    // In production, use pgvector for better performance
    const key = `${this.KNOWLEDGE_KEY_PREFIX}${tenantId}:products`;
    await this.redis.client.set(key, JSON.stringify(chunks), 'EX', 3600); // 1 hour cache

    this.logger.log(
      `✅ Indexed ${chunks.length} products for tenant: ${tenantId}`,
    );
    return chunks.length;
  }

  /**
   * Lưu chính sách shop (do admin nhập)
   */
  async setShopPolicy(
    tenantId: string,
    policyType: 'shipping' | 'return' | 'payment' | 'contact',
    content: string,
  ): Promise<void> {
    const key = `${this.KNOWLEDGE_KEY_PREFIX}${tenantId}:policy:${policyType}`;
    await this.redis.client.set(key, content);
    this.logger.log(`✅ Saved ${policyType} policy for tenant: ${tenantId}`);
  }

  /**
   * Lấy tất cả knowledge của tenant
   */
  async getKnowledge(tenantId: string): Promise<KnowledgeChunk[]> {
    const chunks: KnowledgeChunk[] = [];

    // Get products
    const productsKey = `${this.KNOWLEDGE_KEY_PREFIX}${tenantId}:products`;
    const productsData = await this.redis.client.get(productsKey);
    if (productsData) {
      chunks.push(...JSON.parse(productsData));
    }

    return chunks;
  }

  /**
   * Lấy policies của tenant
   */
  async getPolicies(tenantId: string): Promise<Record<string, string>> {
    const policies: Record<string, string> = {};
    const policyTypes = ['shipping', 'return', 'payment', 'contact'];

    for (const type of policyTypes) {
      const key = `${this.KNOWLEDGE_KEY_PREFIX}${tenantId}:policy:${type}`;
      const content = await this.redis.client.get(key);
      if (content) {
        policies[type] = content;
      }
    }

    return policies;
  }

  /**
   * Tìm kiếm knowledge liên quan (Simple keyword matching)
   * In production, use vector similarity search with pgvector
   */
  async searchKnowledge(
    tenantId: string,
    query: string,
    limit: number = 5,
  ): Promise<KnowledgeChunk[]> {
    const allChunks = await this.getKnowledge(tenantId);

    // Simple keyword matching (improve with embeddings later)
    const lowerQuery = query.toLowerCase();
    const scored = allChunks.map((chunk) => ({
      chunk,
      score: this.calculateRelevance(chunk.content.toLowerCase(), lowerQuery),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.chunk);
  }

  /**
   * Simple relevance scoring (BM25-like)
   */
  private calculateRelevance(content: string, query: string): number {
    const queryTerms = query.split(/\s+/);
    let score = 0;

    for (const term of queryTerms) {
      if (content.includes(term)) {
        score += 1;
        // Bonus for exact phrase match
        if (content.includes(query)) {
          score += 2;
        }
      }
    }

    return score;
  }

  /**
   * Build context từ knowledge chunks cho RAG
   */
  buildContext(
    chunks: KnowledgeChunk[],
    policies: Record<string, string>,
  ): string {
    let context = '';

    // Add products
    if (chunks.length > 0) {
      context += '=== THÔNG TIN SẢN PHẨM ===\n';
      context += chunks.map((c) => c.content).join('\n\n');
      context += '\n\n';
    }

    // Add policies
    if (Object.keys(policies).length > 0) {
      context += '=== CHÍNH SÁCH CỬA HÀNG ===\n';
      if (policies.shipping) {
        context += `Chính sách giao hàng: ${policies.shipping}\n`;
      }
      if (policies.return) {
        context += `Chính sách đổi trả: ${policies.return}\n`;
      }
      if (policies.payment) {
        context += `Phương thức thanh toán: ${policies.payment}\n`;
      }
      if (policies.contact) {
        context += `Liên hệ: ${policies.contact}\n`;
      }
    }

    return context;
  }
}
