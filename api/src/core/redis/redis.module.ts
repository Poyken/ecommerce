import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * =====================================================================
 * REDIS MODULE - Module quản lý kết nối Redis
 * =====================================================================
 *
 * =====================================================================
 */

@Global() // Quan trọng: Giúp dùng ở mọi nơi
@Module({
  providers: [RedisService],
  exports: [RedisService], // Export để module khác dùng được
})
export class RedisModule {}
