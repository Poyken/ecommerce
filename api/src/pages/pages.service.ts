import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get public page by slug (e.g., /home)
   * Uses automatic RLS via tenancyExtension
   */
  async findBySlug(slug: string) {
    const tenant = getTenant();
    if (!tenant) throw new NotFoundException('Tenant context missing');

    const cacheKey = `page:${tenant.id}:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!page) {
      // Return a default structure if not found (Optional)
      // Or throw NotFoundException
      return null;
    }

    await this.cacheManager.set(cacheKey, page, 60000); // Cache 60s
    return page;
  }

  async getTranslations(locale: string) {
    const tenant = getTenant();
    if (!tenant) return {}; // No override logic for non-tenant requests

    const cacheKey = `trans:${tenant.id}:${locale}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const translations = await this.prisma.translation.findMany({
      where: { locale },
    });

    // Convert array to object { "key": "value" }
    const result = translations.reduce((acc, t) => {
      // Deep merge logic (unflatten) could be here if needed
      // For now, simpler is better: client handles flat keys or we unflatten
      // But next-intl messages usually nested.
      // Let's assume we return flat and use a library or custom logic to merge deep.
      // Actually next-intl assumes structure matches.
      // We will assign values to dot notation keys which require unflattening downstream or here.
      // Let's keep it simple: return object, handle unflatten in Controller or Service.
      acc[t.key] = t.value;
      return acc;
    }, {});

    await this.cacheManager.set(cacheKey, result, 300000); // Cache 5 min
    return result;
  }

  async findAll() {
    return this.prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async create(data: {
    slug: string;
    title: string;
    blocks?: any;
    isPublished?: boolean;
  }) {
    const tenant = getTenant();
    if (!tenant) throw new NotFoundException('Tenant context missing');

    const page = await this.prisma.page.create({
      data: {
        ...data,
        tenantId: tenant.id,
      },
    });

    await this.cacheManager.del(`page:${tenant.id}:${data.slug}`);
    return page;
  }

  async update(
    id: string,
    data: {
      slug?: string;
      title?: string;
      blocks?: any;
      isPublished?: boolean;
    },
  ) {
    const tenant = getTenant();
    const existing = await this.findById(id);

    const updated = await this.prisma.page.update({
      where: { id },
      data,
    });

    // Clear cache for both old and new slug to be safe
    await this.cacheManager.del(`page:${tenant?.id}:${existing.slug}`);
    if (data.slug) {
      await this.cacheManager.del(`page:${tenant?.id}:${data.slug}`);
    }

    return updated;
  }

  async delete(id: string) {
    const tenant = getTenant();
    const existing = await this.findById(id);

    await this.prisma.page.delete({
      where: { id },
    });

    await this.cacheManager.del(`page:${tenant?.id}:${existing.slug}`);
    return { success: true };
  }
}
