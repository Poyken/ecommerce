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
  ],
  exports: [ProductsService, SkuManagerService, InventoryService, StockGateway],
})
export class ProductsModule {}
