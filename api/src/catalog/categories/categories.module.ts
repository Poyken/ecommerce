import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@/platform/integrations/external/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';

/**
 * =====================================================================
 * CATEGORIES MODULE - Module quản lý danh mục sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesExportService } from './categories-export.service';
import { CategoriesImportService } from './categories-import.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoriesExportService,
    CategoriesImportService,
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
