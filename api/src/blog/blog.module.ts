import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
/**
 * =====================================================================
 * BLOG MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLOUDINARY INTEGRATION:
 * - Blog thường đi kèm ảnh bìa (Thumbnail) hoặc ảnh nội dung.
 * - Cần import `CloudinaryModule` để có thể upload ảnh lên Cloud và lấy URL về lưu vào DB.
 *
 * 2. STRUCTURE:
 * - Chỉ tập trung vào việc CRUD bài viết.
 * - Phần Comment của bài viết có thể nằm ở đây hoặc tách ra module riêng (tùy độ phức tạp).
 * =====================================================================
 */
export class BlogModule {}
