import { BrandsModule } from '@/brands/brands.module';
import { CategoriesModule } from '@/categories/categories.module';
import { ProductsModule } from '@/products/products.module';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CacheWarmingProcessor } from './processors/cache-warming.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cache-warming',
    }),
    ProductsModule,
    CategoriesModule,
    BrandsModule,
  ],
  providers: [CacheWarmingProcessor],
})
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
          every: 15 * 60 * 1000, // 15 minutes
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
