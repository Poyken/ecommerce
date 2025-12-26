import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * SKUS MODULE - Module quản lý biến thể sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GRANULAR PRODUCT MANAGEMENT:
 * - Trong khi `ProductsModule` quản lý thông tin chung, `SkusModule` quản lý các mặt hàng cụ thể mà khách hàng thực sự mua.
 *
 * 2. CLOUDINARY INTEGRATION:
 * - Import `CloudinaryModule` vì mỗi SKU có thể có hình ảnh riêng (VD: iPhone màu đỏ có ảnh khác iPhone màu xanh).
 *
 * 3. ARCHITECTURE:
 * - Tách biệt SKU giúp hệ thống dễ dàng quản lý tồn kho (Stock) và giá (Price) cho từng biến thể một cách chính xác.
 * =====================================================================
 */
import { SkusController } from './skus.controller';
import { SkusService } from './skus.service';

import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';

import { ProductsModule } from '@/products/products.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, ProductsModule],
  controllers: [SkusController],
  providers: [SkusService],
})
export class SkusModule {}
