import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * =====================================================================
 * PRISMA MODULE - Module quản lý kết nối Database
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL SCOPE (`@Global`):
 * - Hầu như mọi module trong ứng dụng đều cần làm việc với Database.
 * - Việc đánh dấu là `@Global()` giúp ta chỉ cần khai báo `PrismaModule` một lần ở `AppModule`, và `PrismaService` sẽ có sẵn ở khắp mọi nơi.
 *
 * 2. SINGLETON PATTERN:
 * - NestJS đảm bảo chỉ có duy nhất một thực thể (Instance) của `PrismaService` được tạo ra, giúp tiết kiệm bộ nhớ và quản lý kết nối hiệu quả. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Dependency Injection: Cung cấp `PrismaService` cho toàn bộ ứng dụng (UserModule, OrderModule) mà không cần khởi tạo thủ công (`new PrismaClient()`).
 * - Single Instance: Đảm bảo chỉ có 1 kết nối duy nhất đến Database, tránh lỗi "Too many connections" làm sập DB.

 * =====================================================================
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
