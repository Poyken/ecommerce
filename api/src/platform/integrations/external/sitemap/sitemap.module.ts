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
 * =====================================================================
 */
export class SitemapModule {}
