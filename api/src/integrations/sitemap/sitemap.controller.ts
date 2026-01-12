import { Controller, Get, Header } from '@nestjs/common';
import { SitemapService } from './sitemap.service';

/**
 * =====================================================================
 * SITEMAP CONTROLLER - QUẢN LÝ SƠ ĐỒ TRANG WEB (SEO)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SITEMAP (Sơ đồ trang):
 * - Đây là một file XML liệt kê tất cả các link quan trọng của web (Sản phẩm, Bài viết, Danh mục).
 * - Google và các bộ máy tìm kiếm dùng file này để "crawler" dữ liệu và đưa trang web lên kết quả tìm kiếm.
 *
 * 2. DYNAMIC GENERATION:
 * - Thay vì dùng file tĩnh (tốn công sửa), hệ thống sẽ QUERY trực tiếp từ DB để đảm bảo mọi sản phẩm mới đều có trong Sitemap ngay lập tức. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
@Controller('sitemap')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(): Promise<string> {
    return this.sitemapService.generateSitemap();
  }
}
