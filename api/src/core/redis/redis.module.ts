import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * =====================================================================
 * REDIS MODULE - Module quản lý kết nối Redis
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL MODULE (`@Global`):
 * - Redis thường được sử dụng ở rất nhiều nơi (Auth, Cache, Queue).
 * - Việc đánh dấu là `@Global()` giúp ta chỉ cần khai báo kết nối một lần và sử dụng ở bất kỳ đâu mà không cần import lại.
 *
 * 2. PROVIDERS & EXPORTS:
 * - `RedisService` được khai báo trong `providers` để NestJS quản lý vòng đời.
 * - `exports` giúp các module khác có thể "tiêm" (Inject) `RedisService` vào để sử dụng.
 * =====================================================================
 */

@Global() // Quan trọng: Giúp dùng ở mọi nơi
@Module({
  providers: [RedisService],
  exports: [RedisService], // Export để module khác dùng được
})
export class RedisModule {}
