import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { CacheService } from './cache.service';
import { LoggerService } from './logger.service';

/**
 * CommonModule - Shared utilities and services
 * Global module providing logging and caching across the application.
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [LoggerService, CacheService],
  exports: [LoggerService, CacheService],
})
export class CommonModule {}
