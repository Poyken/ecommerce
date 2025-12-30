import { BrandsService } from '@/brands/brands.service';
import { CategoriesService } from '@/categories/categories.service';
import { SortOption } from '@/products/dto/filter-product.dto';
import { ProductsService } from '@/products/products.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * CACHE WARMING PROCESSOR - HỆ THỐNG "LÀM NÓNG" BỘ NHỚ ĐỆM
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CACHE WARMING (Làm nóng Cache):
 * - Thông thường, lần đầu tiên người dùng vào web sẽ bị chậm vì server phải gọi DB (Cold Start).
 * - Processor này giải quyết vấn đề đó bằng cách chủ động gọi các API nặng (như danh sách sản phẩm trang chủ, danh mục) để đưa vào Cache trước khi có người dùng thực tế yêu cầu.
 *
 * 2. TẠI SAO PHẢI LÀM?
 * - Giảm thời gian phản hồi (TTFB) cho những trang quan trọng nhất.
 * - Tránh việc DB bị quá tải đột ngột khi vừa mới khởi động lại server.
 * =====================================================================
 */
@Processor('cache-warming')
export class CacheWarmingProcessor extends WorkerHost {
  private readonly logger = new Logger(CacheWarmingProcessor.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.name}...`);

    switch (job.name) {
      case 'warm-home-products':
        await this.warmHomeProducts();
        break;
      case 'warm-categories':
        await this.warmCategories();
        break;
      case 'warm-brands':
        await this.warmBrands();
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async warmHomeProducts() {
    this.logger.log('Warming Core Product Lists for Homepage...');

    try {
      // 1. Newest Products (Homepage Grid)
      await this.productsService.findAll({
        limit: 12,
        page: 1,
        sort: SortOption.NEWEST,
      });

      // 2. Default Featured List
      await this.productsService.findAll({ limit: 12, page: 1 });

      this.logger.log('HomePage Product Lists Warmed Successfully');
    } catch (error) {
      this.logger.error('Failed to warm home products', error);
      throw error;
    }
  }

  private async warmCategories() {
    this.logger.log('Warming Category Tree...');
    try {
      // Warm the default categories list (used in Menu/Homepage)
      await this.categoriesService.findAll(undefined, 1, 100);
      this.logger.log('Category Tree Warmed Successfully');
    } catch (error) {
      this.logger.error('Failed to warm categories', error);
    }
  }

  private async warmBrands() {
    this.logger.log('Warming Top Brands...');
    try {
      // Warm the default brands list
      await this.brandsService.findAll(undefined, 1, 100);
      this.logger.log('Brands List Warmed Successfully');
    } catch (error) {
      this.logger.error('Failed to warm brands', error);
    }
  }
}
