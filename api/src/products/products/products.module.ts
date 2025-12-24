import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

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
 * - Import `PrismaModule` để thực hiện các thao tác truy vấn và lưu trữ thông tin sản phẩm, danh mục, thương hiệu.
 * =====================================================================
 */
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SkuManagerService } from './sku-manager.service';

import { InventoryService } from '../skus/inventory.service';

import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ProductsController],
  providers: [ProductsService, SkuManagerService, InventoryService],
  exports: [ProductsService, SkuManagerService, InventoryService],
})
export class ProductsModule {}
