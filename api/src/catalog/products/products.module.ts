import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * PRODUCTS MODULE - Module quản lý sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */
import { ProductsExportService } from './products-export.service';
import { ProductsImportService } from './products-import.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SkuManagerService } from './sku-manager.service';

import { InventoryService } from '@/catalog/skus/inventory.service';
import { StockGateway } from '@/catalog/skus/stock.gateway';

import { NotificationsModule } from '@/notifications/notifications.module';

import { TenantsModule } from '@/identity/tenants/tenants.module';

// Use Cases
import {
  CreateProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  GetRelatedProductsUseCase,
  SemanticSearchUseCase,
  BulkUpdateSkusUseCase,
  GetSkusDetailsUseCase,
  GetProductTranslationsUseCase,
  TranslateProductUseCase,
} from '../application/use-cases/products';

// Interface Tokens
import {
  PRODUCT_REPOSITORY,
  CATEGORY_REPOSITORY,
  BRAND_REPOSITORY,
} from '../domain/repositories';

// Implementations
import {
  PrismaProductRepository,
  PrismaCategoryRepository,
  PrismaBrandRepository,
} from '../infrastructure/repositories';

@Module({
  imports: [PrismaModule, NotificationsModule, TenantsModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    SkuManagerService,
    InventoryService,
    StockGateway,
    ProductsExportService,
    ProductsImportService,
    // Use Cases
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetRelatedProductsUseCase,
    SemanticSearchUseCase,
    BulkUpdateSkusUseCase,
    GetSkusDetailsUseCase,
    GetProductTranslationsUseCase,
    TranslateProductUseCase,
    // Repositories
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: BRAND_REPOSITORY,
      useClass: PrismaBrandRepository,
    },
  ],
  exports: [
    ProductsService,
    SkuManagerService,
    InventoryService,
    StockGateway,
    PRODUCT_REPOSITORY,
    CATEGORY_REPOSITORY,
    BRAND_REPOSITORY,
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetRelatedProductsUseCase,
    SemanticSearchUseCase,
    BulkUpdateSkusUseCase,
    GetSkusDetailsUseCase,
    GetProductTranslationsUseCase,
    TranslateProductUseCase,
  ],
})
export class ProductsModule {}
