import { Module } from '@nestjs/common';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CloudinaryModule } from './external/cloudinary/cloudinary.module';
import { NewsletterModule } from './external/newsletter/newsletter.module';
import { SitemapModule } from './external/sitemap/sitemap.module';

/**
 * ======================================================================
 * PLATFORM INTEGRATIONS MODULE - Quản lý Webhooks & External Integrations
 * ======================================================================
 *
 * 📚 GIẢI THÍCH:
 *
 * 1. WEBHOOKS:
 * - Nhận events từ external services (Stripe, PayPal, etc.)
 *
 * 2. EXTERNAL INTEGRATIONS:
 * - Cloudinary: Image hosting
 * - Newsletter: Email marketing
 * - Sitemap: SEO
 *
 * ======================================================================
 */

@Module({
  imports: [WebhooksModule, CloudinaryModule, NewsletterModule, SitemapModule],
  exports: [WebhooksModule, CloudinaryModule, NewsletterModule, SitemapModule],
})
export class PlatformIntegrationsModule {}
