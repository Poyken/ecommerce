import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';

/**
 * =====================================================================
 * CATEGORIES MODULE - Module quản lý danh mục sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CORE COMPONENT:
 * - Danh mục là xương sống để tổ chức sản phẩm trên sàn TMĐT.
 * - Module này đóng gói toàn bộ logic liên quan đến việc tạo, sửa, xóa và hiển thị danh mục.
 *
 * 2. PRISMA INTEGRATION:
 * - Import `PrismaModule` để có thể truy cập Database thông qua `PrismaService`.
 * =====================================================================
 */
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
