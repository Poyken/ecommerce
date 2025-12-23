import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { CacheService } from './cache.service';
import { EmailService } from './email/email.service';
import { LoggerService } from './logger.service';

/**
 * =====================================================================
 * COMMON MODULE - Module chứa các tiện ích dùng chung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL SCOPE (`@Global`):
 * - Khi đánh dấu là `@Global()`, các service trong module này (như `LoggerService`, `CacheService`) sẽ có sẵn ở khắp mọi nơi trong ứng dụng.
 * - Ta không cần phải import `CommonModule` vào từng module con khác nữa.
 *
 * 2. SHARED UTILITIES:
 * - Tập trung các dịch vụ hạ tầng (Infrastructure) như Logging và Caching vào một nơi duy nhất để dễ quản lý và cấu hình.
 *
 * 3. REUSABILITY:
 * - Giúp code tuân thủ nguyên lý DRY (Don't Repeat Yourself), tránh việc khởi tạo lại các dịch vụ cơ bản ở nhiều nơi.
 * =====================================================================
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [LoggerService, CacheService, EmailService],
  exports: [LoggerService, CacheService, EmailService],
})
export class CommonModule {}
