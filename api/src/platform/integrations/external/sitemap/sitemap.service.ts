import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =====================================================================
 * SITEMAP SERVICE - Tạo XML Sitemap cho SEO
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class SitemapService {
  private baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async generateSitemap(): Promise<string> {
    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    for (const page of staticPages) {
      xml += this.createUrlEntry(
        page.url,
        undefined,
        page.changefreq,
        page.priority,
      );
    }

    // Categories
    for (const category of categories) {
      xml += this.createUrlEntry(
        `/shop?categoryId=${category.slug}`,
        category.updatedAt,
        'weekly',
        '0.8',
      );
    }

    // Products
    for (const product of products) {
      xml += this.createUrlEntry(
        `/products/${product.slug}`,
        product.updatedAt,
        'weekly',
        '0.7',
      );
    }

    xml += '</urlset>';

    return xml;
  }

  private createUrlEntry(
    path: string,
    lastmod?: Date,
    changefreq = 'weekly',
    priority = '0.5',
  ): string {
    const url = `${this.baseUrl}${path}`;
    let entry = `  <url>
    <loc>${this.escapeXml(url)}</loc>
`;
    if (lastmod) {
      entry += `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
`;
    }
    entry += `    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    return entry;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
