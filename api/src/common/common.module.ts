import { CacheService } from '@core/cache/cache.service';
import { LoggerService } from '@core/logger/logger.service';
import { RedisModule } from '@core/redis/redis.module';
import { EmailService } from '@integrations/email/email.service';
import { Global, Module } from '@nestjs/common';
import { CacheL1Service } from './cache-l1.service';
import { EncryptionService } from '@core/security/encryption.service';

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
 * - Giúp code tuân thủ nguyên lý DRY (Don't Repeat Yourself), tránh việc khởi tạo lại các dịch vụ cơ bản ở nhiều nơi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [
    LoggerService,
    CacheService,
    EmailService,
    CacheL1Service,
    EncryptionService,
  ],
  exports: [
    LoggerService,
    CacheService,
    EmailService,
    CacheL1Service,
    EncryptionService,
  ],
})
export class CommonModule {}
