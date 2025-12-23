import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { PrismaModule } from 'src/prisma/prisma.module';

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
 * - Sử dụng `PrismaModule` để tương tác với bảng `Brand` trong Database.
 * =====================================================================
 */
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
