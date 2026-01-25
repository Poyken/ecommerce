import { QueryUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

export interface SemanticSearchInput {
  query: string;
  limit?: number;
  tenantId?: string;
}

export type SemanticSearchOutput = {
  products: any[];
};

@Injectable()
export class SemanticSearchUseCase extends QueryUseCase<
  SemanticSearchInput,
  SemanticSearchOutput
> {
  private readonly logger = new Logger(SemanticSearchUseCase.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: SemanticSearchInput,
  ): Promise<Result<SemanticSearchOutput, Error>> {
    const { query, limit = 10 } = input;

    try {
      this.logger.log(`Performing semantic search for: "${query}"`);

      // 1. Try AI-based vector search if GOOGLE_API_KEY is available
      if (process.env.GOOGLE_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'embedding-001' });

          const embeddingResult = await model.embedContent(query);
          const embedding = embeddingResult.embedding.values;

          if (embedding && embedding.length > 0) {
            const vectorStr = `[${embedding.join(',')}]`;

            // Row SQL for pgvector similarity search
            const products = await this.prisma.$queryRaw`
              SELECT id, name, slug, description, "avgRating", "reviewCount", "minPrice",
                     1 - (embedding <=> ${vectorStr}::vector) as similarity
              FROM "Product"
              WHERE embedding IS NOT NULL AND "deletedAt" IS NULL
              ORDER BY embedding <=> ${vectorStr}::vector
              LIMIT ${limit};
            `;

            return Result.ok({ products: products as any[] });
          }
        } catch (aiError) {
          this.logger.error(
            'AI Embedding failed, falling back to text search',
            aiError,
          );
        }
      }

      // 2. Fallback to standard full-text / contains search
      const results = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          minPrice: true,
          maxPrice: true,
          avgRating: true,
          reviewCount: true,
          images: {
            take: 1,
            select: { url: true },
          },
        },
      });

      return Result.ok({ products: results });
    } catch (error) {
      this.logger.error('Semantic search failed', error);
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
