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
/**
 * =====================================================================
 * WORKER MODULE - Xử lý tác vụ nền (Background Jobs)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CACHE WARMING (Làm nóng Cache):
 * - Hệ thống eCommerce yêu cầu tốc độ hiển thị cực nhanh.
 * - Thay vì chờ user vào mới cache (Lazy Loading), ta chủ động chạy Cron Job
 *   để query dữ liệu và nạp vào Redis trước.
 *
 * 2. CRON SCHEDULE:
 * - Sử dụng BullMQ để lên lịch chạy định kỳ (VD: mỗi 15 phút update sản phẩm trang chủ).
 * - `onApplicationBootstrap`: Hook chạy ngay khi App khởi động để đăng ký lịch.
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
