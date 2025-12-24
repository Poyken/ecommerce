import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ProductsModule } from '../products/products/products.module';
import { CacheWarmingProcessor } from './processors/cache-warming.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cache-warming',
    }),
    ProductsModule,
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
          every: 10 * 60 * 1000, // 10 minutes
        },
        jobId: 'warm-home-products-cron-v1', // Unique ID ensures one cron per queue
        removeOnComplete: 10, // keep last 10
        removeOnFail: 10,
      },
    );
    this.logger.log('Cache Warming cron job scheduled successfully.');
  }
}
