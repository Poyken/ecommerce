import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * SKUS MODULE - Module quản lý biến thể sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */
import { SkusController } from './skus.controller';
import { SkusService } from './skus.service';

import { CloudinaryModule } from '@/platform/integrations/external/cloudinary/cloudinary.module';

import { ProductsModule } from '@/catalog/products/products.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, ProductsModule],
  controllers: [SkusController],
  providers: [SkusService],
})
export class SkusModule {}
