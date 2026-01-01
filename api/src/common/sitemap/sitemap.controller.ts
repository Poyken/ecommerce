import { SitemapService } from '@integrations/sitemap/sitemap.service';
import { Controller, Get, Header } from '@nestjs/common';

@Controller('sitemap')
export class SitemapController {
  /**
   * =====================================================================
   * SITEMAP CONTROLLER - Bản đồ trang web
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. DYNAMIC XML GENERATION:
   * - Sitemap không phải là file tĩnh (static file) mà được sinh ra động (Dynamic) mỗi khi Google Bot truy cập.
   * - Nó query DB lấy tất cả Product/Category slug để tạo ra các link tương ứng.
   *
   * 2. SEO IMPORTANCE:
   * - Giúp Google index các trang sản phẩm mới nhanh hơn.
   * - `Header('Content-Type', 'application/xml')` là bắt buộc để Bot hiểu đây là XML.
   * =====================================================================
   */
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(): Promise<string> {
    return this.sitemapService.generateSitemap();
  }
}
