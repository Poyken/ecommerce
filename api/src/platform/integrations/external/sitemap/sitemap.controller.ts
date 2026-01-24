import { Controller, Get, Header } from '@nestjs/common';
import { SitemapService } from './sitemap.service';

/**
 * =====================================================================
 * SITEMAP CONTROLLER - QUẢN LÝ SƠ ĐỒ TRANG WEB (SEO)
 * =====================================================================
 *
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
