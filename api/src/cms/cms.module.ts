import { Module } from '@nestjs/common';
import { BlogModule } from './blog/blog.module';
import { PagesModule } from './pages/pages.module';
import { MediaModule } from './media/media.module';

/**
 * ======================================================================
 * CMS MODULE - Content Management System
 * ======================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTENT MANAGEMENT:
 * - Quản lý mọi nội dung tĩnh và động của website
 * - Blog: Bài viết, tin tức
 * - Pages: Static pages (About, Contact, Terms)
 * - Media: Quản lý hình ảnh, videos
 *
 * 2. MICROSERVICES READY:
 * - Module này có thể tách thành CMS service riêng biệt
 *
 * ======================================================================
 */

@Module({
  imports: [BlogModule, PagesModule, MediaModule],
  exports: [BlogModule, PagesModule, MediaModule],
})
export class CmsModule {}
