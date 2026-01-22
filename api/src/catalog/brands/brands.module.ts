import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@/platform/integrations/external/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';

/**
 * =====================================================================
 * BRANDS MODULE - Module quản lý thương hiệu
 * =====================================================================
 *
 * =====================================================================
 */
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsExportService } from './brands-export.service';
import { BrandsImportService } from './brands-import.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [BrandsController],
  providers: [BrandsService, BrandsExportService, BrandsImportService],
  exports: [BrandsService],
})
export class BrandsModule {}
