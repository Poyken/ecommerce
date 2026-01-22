import { CacheService } from '@core/cache/cache.service';
import { LoggerService } from '@core/logger/logger.service';
import { RedisModule } from '@core/redis/redis.module';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { Global, Module } from '@nestjs/common';
import { CacheL1Service } from './cache-l1.service';
import { EncryptionService } from '@core/security/encryption.service';

/**
 * =====================================================================
 * COMMON MODULE - Module chứa các tiện ích dùng chung
 * =====================================================================
 *
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
