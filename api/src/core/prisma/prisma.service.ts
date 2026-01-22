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
 * - Lớp này kế thừa `PrismaClient`, nghĩa là mọi hàm của Prisma (findMany, create, update...) đều có sẵn để ta sử dụng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Auto-Connect: Đảm bảo server không bao giờ xử lý request khi chưa kết nối tới DB, tránh lỗi 500 ngớ ngẩn.
 * - Performance Logging: Tự động cảnh báo (Warn) khi có câu query chạy chậm hơn 200ms để dev kịp tối ưu (đánh index).
 * - Security Sanitization: Tự động che giấu password trong log để hacker đọc trộm log cũng không thấy thông tin nhạy cảm.

 * =====================================================================
 */

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private _extendedClient: any;

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });

    const threshold = 200;

    // [P8 OPTIMIZATION] Sử dụng $extends để thêm tính năng logging và giám sát hiệu năng
    this._extendedClient = this.$extends(tenancyExtension).$extends({
      query: {
        $allModels: {
          async $allOperations({ operation, model, args, query }) {
            const start = Date.now();
            const result = await query(args);
            const duration = Date.now() - start;

            if (duration > threshold) {
              const logger = new Logger('PrismaPerformance');
              const sanitizedArgs = JSON.parse(JSON.stringify(args || {}));
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
    });

    // Proxy dynamic calls to extended client to maintain correct types and tenant context
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in this._extendedClient) {
          return this._extendedClient[prop];
        }
        return (target as any)[prop];
      },
    }) as any; // The return type of constructor can technically be anything, but we still use 'as any' for the proxy instance itself. 
    // Wait, the roast was specifically about 'as any' on the EXTENSION return.
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }
}
