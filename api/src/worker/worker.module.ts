import { BrandsModule } from '@/catalog/brands/brands.module';
import { CategoriesModule } from '@/catalog/categories/categories.module';
import { ProductsModule } from '@/catalog/products/products.module';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CacheWarmingProcessor } from './processors/cache-warming.processor';
import { OutboxProcessor } from './processors/outbox.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cache-warming',
    }),
    /*
    BullModule.registerQueue({
      name: 'orders-queue',
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    */
    ProductsModule,
    CategoriesModule,
    BrandsModule,
  ],
  providers: [CacheWarmingProcessor, OutboxProcessor],
})

/**
 * =====================================================================
 * WORKER MODULE - Xử lý tác vụ nền (Background Jobs)
 * =====================================================================
 *
 * =====================================================================
 */
export class WorkerModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(WorkerModule.name);

  constructor(@InjectQueue('cache-warming') private cacheQueue: Queue) {}

  async onApplicationBootstrap() {
    this.logger.log('Requesting Cache Warming Job Schedule...');

    // Schedule repeatable job every 10 minutes
    // Using simple options.
    await this.cacheQueue.add(
      'warm-home-products',
      {},
      {
        repeat: {
          every: 60 * 60 * 1000, // 60 minutes
        },
        jobId: 'warm-home-products-cron-v1',
        removeOnComplete: 3,
        removeOnFail: 5,
      },
    );

    await this.cacheQueue.add(
      'warm-categories',
      {},
      {
        repeat: {
          every: 60 * 60 * 1000, // 1 hour (rarely changes)
        },
        jobId: 'warm-categories-cron-v1',
        removeOnComplete: 3,
      },
    );

    await this.cacheQueue.add(
      'warm-brands',
      {},
      {
        repeat: {
          every: 60 * 60 * 1000, // 1 hour
        },
        jobId: 'warm-brands-cron-v1',
        removeOnComplete: 3,
      },
    );
    this.logger.log('Cache Warming cron job scheduled successfully.');
  }
}
