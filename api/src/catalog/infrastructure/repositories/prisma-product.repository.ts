/**
 * =====================================================================
 * PRISMA PRODUCT REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 *
 * Clean Architecture: Infrastructure Layer
 *
 * This is the Prisma implementation of IProductRepository.
 * It handles all database operations for Products.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CacheService } from '@core/cache/cache.service';
import {
  IProductRepository,
  ProductQueryOptions,
  ProductSortOption,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductMapper } from '../mappers/product.mapper';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { getTenant } from '@core/tenant/tenant.context';

const CACHE_TTL = {
  PRODUCT_DETAIL: 300, // 5 minutes
  PRODUCT_LIST: 60, // 1 minute
};

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const tenant = getTenant();
    const cacheKey = `product:${tenant?.id || 'public'}:${id}`;

    const cachedProduct = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const data = await (this.prisma.product as any).findFirst({
          where: {
            id,
            ...(tenant && { tenantId: tenant.id }),
          },
          include: this.getProductIncludes(),
        });

        return data ? ProductMapper.toDomain(data) : null;
      },
      CACHE_TTL.PRODUCT_DETAIL,
    );

    if (!(cachedProduct instanceof Product)) {
      // If it's a plain object from cache, map it back to domain entity
      // ProductMapper.toDomain handles both Prisma and POJO formats
      return ProductMapper.toDomain(cachedProduct as any);
    }

    return cachedProduct;
  }

  async findByIdOrFail(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundException(`Product not found: ${id}`);
    }
    return product;
  }

  async findBySlug(tenantId: string, slug: string): Promise<Product | null> {
    const data = await (this.prisma.product as any).findFirst({
      where: {
        slug,
        tenantId,
        deletedAt: null,
      },
      include: this.getProductIncludes(),
    });

    return data ? ProductMapper.toDomain(data) : null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma.product as any).count({
      where: { id },
    });
    return count > 0;
  }

  async isSlugUnique(
    tenantId: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = {
      slug,
      tenantId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await (this.prisma.product as any).count({ where });
    return count === 0;
  }

  async findAll(
    tenantId: string,
    options: ProductQueryOptions,
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, filter, sortBy } = options;
    const skip = calculateSkip(page, limit);

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: filter?.isDeleted ? { not: null } : null,
    };

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.categoryId) {
      where.categories = { some: { categoryId: filter.categoryId } };
    }

    if (filter?.brandId) {
      where.brandId = filter.brandId;
    }

    if (filter?.minPrice !== undefined) {
      where.maxPrice = { gte: filter.minPrice };
    }

    if (filter?.maxPrice !== undefined) {
      where.minPrice = { lte: filter.maxPrice };
    }

    if (filter?.ids?.length) {
      where.id = { in: filter.ids };
    }

    // Build orderBy
    const orderBy = this.buildOrderBy(sortBy);

    // Execute queries
    const [data, total] = await Promise.all([
      (this.prisma.product as any).findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.getProductListIncludes(),
      }),
      (this.prisma.product as any).count({ where }),
    ]);

    const products = ProductMapper.toDomainList(data);
    return createPaginatedResult(products, total, page, limit);
  }

  async findRelated(
    productId: string,
    categoryIds: string[],
    limit = 4,
  ): Promise<Product[]> {
    if (categoryIds.length === 0) return [];

    const data = await (this.prisma.product as any).findMany({
      where: {
        id: { not: productId },
        deletedAt: null,
        categories: {
          some: { categoryId: { in: categoryIds } },
        },
      },
      take: limit,
      orderBy: { avgRating: 'desc' },
      include: this.getProductListIncludes(),
    });

    return ProductMapper.toDomainList(data);
  }

  async countByTenant(tenantId: string): Promise<number> {
    return (this.prisma.product as any).count({
      where: { tenantId, deletedAt: null },
    });
  }

  async save(product: Product): Promise<Product> {
    const data = ProductMapper.toPersistence(product);
    const tenant = getTenant();

    // Check if product exists
    const existing = await (this.prisma.product as any).findUnique({
      where: { id: product.id },
    });

    let savedData;

    if (existing) {
      // Update
      savedData = await (this.prisma.product as any).update({
        where: { id: product.id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          brandId: data.brandId,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          avgRating: data.avgRating,
          reviewCount: data.reviewCount,
          metadata: data.metadata as any,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
        },
        include: this.getProductIncludes(),
      });
    } else {
      // Create
      savedData = await (this.prisma.product as any).create({
        data: {
          id: data.id,
          tenantId: tenant?.id || data.tenantId,
          name: data.name,
          slug: data.slug,
          description: data.description,
          brandId: data.brandId,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          avgRating: data.avgRating || 0,
          reviewCount: data.reviewCount || 0,
          metadata: data.metadata as any,
        } as any,
        include: this.getProductIncludes(),
      });
    }

    // Invalidate cache
    await this.invalidateCache(product.id);

    return ProductMapper.toDomain(savedData);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.product as any).update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.invalidateCache(id);
  }

  async hardDelete(id: string): Promise<void> {
    await (this.prisma.product as any).delete({
      where: { id },
    });
    await this.invalidateCache(id);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    const data = await (this.prisma.product as any).findMany({
      where: { id: { in: ids } },
      include: this.getProductIncludes(),
    });

    return ProductMapper.toDomainList(data);
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private getProductIncludes() {
    return {
      brand: true,
      categories: {
        include: { category: true },
      },
      options: {
        include: { values: true },
        orderBy: { displayOrder: 'asc' as const },
      },
      images: {
        orderBy: { displayOrder: 'asc' as const },
      },
      skus: {
        include: {
          images: { orderBy: { displayOrder: 'asc' as const } },
          optionValues: {
            include: {
              optionValue: {
                include: { option: true },
              },
            },
          },
        },
      },
    };
  }

  private getProductListIncludes() {
    return {
      brand: {
        select: { id: true, name: true },
      },
      categories: {
        select: {
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      images: {
        select: { url: true, alt: true },
        orderBy: { displayOrder: 'asc' as const },
        take: 1,
      },
    };
  }

  private buildOrderBy(sortBy?: ProductSortOption): any[] {
    switch (sortBy) {
      case 'newest':
        return [{ createdAt: 'desc' }, { id: 'desc' }];
      case 'oldest':
        return [{ createdAt: 'asc' }, { id: 'asc' }];
      case 'price_asc':
        return [{ minPrice: 'asc' }, { id: 'asc' }];
      case 'price_desc':
        return [{ minPrice: 'desc' }, { id: 'desc' }];
      case 'rating_desc':
        return [{ avgRating: 'desc' }, { id: 'desc' }];
      case 'name_asc':
        return [{ name: 'asc' }, { id: 'asc' }];
      default:
        return [{ createdAt: 'desc' }, { id: 'desc' }];
    }
  }

  private async invalidateCache(productId: string): Promise<void> {
    const tenant = getTenant();
    await Promise.all([
      this.cacheService.del(`product:${tenant?.id || 'public'}:${productId}`),
      this.cacheService.invalidatePattern(
        `products:filter:${tenant?.id || 'public'}:*`,
      ),
    ]);
  }
}
