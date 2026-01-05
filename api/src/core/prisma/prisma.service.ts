import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenancyExtension } from '../tenant/prisma-tenancy.extension';

/**
 * =====================================================================
 * PRISMA SERVICE - Cầu nối tới cơ sở dữ liệu (PostgreSQL)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ORM (Object-Relational Mapping):
 * - Prisma giúp ta làm việc với Database bằng code TypeScript thay vì viết SQL thuần.
 * - `PrismaClient` được sinh ra tự động dựa trên file `schema.prisma`, giúp ta có Type-safety (gợi ý code chính xác).
 *
 * 2. CONNECTION MANAGEMENT:
 * - `onModuleInit`: Tự động kết nối tới DB khi ứng dụng khởi động.
 * - `onModuleDestroy`: Tự động ngắt kết nối khi ứng dụng tắt, tránh rò rỉ tài nguyên (Connection Leak).
 *
 * 3. INHERITANCE:
 * - Lớp này kế thừa `PrismaClient`, nghĩa là mọi hàm của Prisma (findMany, create, update...) đều có sẵn để ta sử dụng.
 * =====================================================================
 */

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });

    const threshold = 200;

    // [P8 OPTIMIZATION] Use $extends for modern logging and performance monitoring
    // Returns the extended client which will be used as the actual singleton instance
    const client = this.$extends(tenancyExtension);

    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ operation, model, args, query }) {
            const start = Date.now();
            const result = await query(args);
            const duration = Date.now() - start;

            if (duration > threshold) {
              const logger = new Logger('PrismaPerformance');
              // Sanitize args to avoid logging sensitive info like passwords
              const sanitizedArgs = JSON.parse(JSON.stringify(args));
              const sensitiveFields = ['password', 'token', 'secret', 'key'];

              const sanitize = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;
                for (const key in obj) {
                  if (sensitiveFields.includes(key.toLowerCase())) {
                    obj[key] = '[REDACTED]';
                  } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                  }
                }
              };
              sanitize(sanitizedArgs);

              logger.warn(
                `🐢 Slow Query [${model}.${operation}] - ${duration}ms\nArgs: ${JSON.stringify(sanitizedArgs)}`,
              );
            }
            return result;
          },
        },
      },
    }) as any;
  }

  async onModuleInit() {
    await (this as any).$connect();
    this.logger.log('✅ Database connected successfully');

    this.logger.debug(
      `📊 Connection pool size: ${process.env.DATABASE_POOL_SIZE || '10 (default)'}`,
    );
  }

  async onModuleDestroy() {
    await (this as any).$disconnect();
    this.logger.log('🔌 Database disconnected');
  }
}
