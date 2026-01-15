import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';

@Module({
  imports: [PrismaModule],
  controllers: [SitemapController],
  providers: [SitemapService],
  exports: [SitemapService],
})
/**
 * =====================================================================
 * SITEMAP MODULE - Hỗ trợ SEO
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC SITEMAP:
 * - Sitemap.xml giúp Google đánh chỉ mục (index) trang web tốt hơn.
 * - Module này query tất cả Product/Category từ DB để tạo danh sách URL động.
 *
 * 2. CONTROLLER:
 * - `SitemapController` sẽ trả về XML (text/xml) thay vì JSON thường thấy. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class SitemapModule {}
