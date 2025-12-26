import { SortOption } from '@/products/dto/filter-product.dto';
import { ProductsService } from '@/products/products.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('cache-warming')
export class CacheWarmingProcessor extends WorkerHost {
  private readonly logger = new Logger(CacheWarmingProcessor.name);

  constructor(private readonly productsService: ProductsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.name}...`);

    switch (job.name) {
      case 'warm-home-products':
        await this.warmHomeProducts();
        break;
      case 'warm-categories':
        // Future: warm categories tree
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async warmHomeProducts() {
    this.logger.log('Warming Core Product Lists for Homepage...');

    try {
      // 1. Default List (Newest)
      await this.productsService.findAll({
        limit: 10,
        page: 1,
        sort: SortOption.NEWEST,
      });

      // 2. Best Sellers (using sort if available or simple list)
      // Currently ProductsService sort options: NEWEST, OLDEST, PRICE_ASC, PRICE_DESC.
      // Best Selling is not yet a sort option in Service, but maybe specific query?
      // Let's just warm the Newest generic list which is the default homepage view.
      await this.productsService.findAll({ limit: 12, page: 1 }); // Grid 3x4 or 4x3

      this.logger.log('HomePage Product Lists Warmed Successfully');
    } catch (error) {
      this.logger.error('Failed to warm home products', error);
      throw error;
    }
  }
}
