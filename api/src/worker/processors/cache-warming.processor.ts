import { BrandsService } from '@/catalog/brands/brands.service';
import { CategoriesService } from '@/catalog/categories/categories.service';
import { SortOption } from '@/catalog/products/dto/filter-product.dto';
import { ProductsService } from '@/catalog/products/products.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * CACHE WARMING PROCESSOR - HỆ THỐNG "LÀM NÓNG" BỘ NHỚ ĐỆM
 * =====================================================================
 *
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
      case 'warm-hot-products':
        await this.warmHotProducts();
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async warmHomeProducts() {
    this.logger.log('Warming Core Product Lists for Homepage...');

    try {
      // 1. Newest Products (Homepage Grid & Featured)
      await this.productsService.findAll({
        limit: 12,
        page: 1,
        sort: SortOption.NEWEST,
      });

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

  private async warmHotProducts() {
    this.logger.log('Warming Hot Products (High Rating & Reviews)...');
    try {
      // Warm products with high rating (Proxy for "Hot")
      await this.productsService.findAll({
        limit: 24,
        page: 1,
        sort: SortOption.RATING_DESC,
      });
      this.logger.log('Hot Products Warmed Successfully');
    } catch (error) {
      this.logger.error('Failed to warm hot products', error);
    }
  }
}
