import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
  constructor() {
    super();
  }

  onModuleInit() {
    this.$connect();
  }

  onModuleDestroy() {
    this.$disconnect();
  }
}
