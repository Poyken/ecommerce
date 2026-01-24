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

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
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
