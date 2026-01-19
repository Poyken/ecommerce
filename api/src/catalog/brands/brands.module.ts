import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';

/**
 * =====================================================================
 * BRANDS MODULE - Module quản lý thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT OF PRODUCTS:
 * - Thương hiệu là một phần quan trọng để phân loại sản phẩm.
 * - Module này cung cấp các API CRUD cơ bản để Admin quản lý danh sách thương hiệu (Apple, Samsung, Nike, v.v.).
 *
 * 2. PRISMA INTEGRATION:
 * - Sử dụng `PrismaModule` để tương tác với bảng `Brand` trong Database. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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
