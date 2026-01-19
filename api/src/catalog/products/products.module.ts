import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * PRODUCTS MODULE - Module quản lý sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CORE FEATURE:
 * - Đây là module quan trọng nhất của một sàn TMĐT, quản lý toàn bộ vòng đời của sản phẩm.
 *
 * 2. SKU MANAGEMENT:
 * - `SkuManagerService`: Một service chuyên biệt được tách ra để xử lý logic phức tạp về việc tạo và quản lý các biến thể (SKU) của sản phẩm.
 * - Giúp `ProductsService` không bị quá tải logic (Fat Service).
 *
 * 3. DATABASE ACCESS:
 * - Import `PrismaModule` để thực hiện các thao tác truy vấn và lưu trữ thông tin sản phẩm, danh mục, thương hiệu. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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

import { TenantsModule } from '@/tenants/tenants.module';

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
