import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  FindOptions,
  PaginatedResult,
} from '@core/repository/base.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';

/**
 * =====================================================================
 * PRODUCTS REPOSITORY - TRUY CẬP DỮ LIỆU SẢN PHẨM
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 *    - Tập trung tất cả các queries liên quan đến Product vào một nơi.
 *    - ProductsService sẽ gọi repository này thay vì gọi Prisma trực tiếp.
 *    - Giúp code clean hơn và dễ test hơn.
 *
 * 2. CÁC METHODS:
 *    - findWithFilters(): Query phức tạp với search, filter, sort.
 *    - findBySlug(): Tìm sản phẩm theo slug (URL friendly).
 *    - findByBrand(): Lọc theo thương hiệu.
 *    - findByCategories(): Lọc theo danh mục.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ:
 * - Tách biệt data access logic ra khỏi business logic.
 * - Dễ dàng optimize queries ở một nơi tập trung.
 * - Có thể switch sang database khác mà không ảnh hưởng services.
 *
 * =====================================================================
 */

/**
 * Filter options cho products
 */
export interface ProductFilterOptions {
  search?: string;
  brandId?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sortBy?: 'createdAt' | 'name' | 'minPrice' | 'maxPrice' | 'avgRating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Product với đầy đủ relations
 */
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    categories: { include: { category: true } };
    images: true;
    skus: true;
    options: { include: { values: true } };
  };
}>;

@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
  protected readonly modelName = 'product';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Default includes cho product detail
   */
  private get defaultIncludes() {
    return {
      brand: true,
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      images: {
        orderBy: { displayOrder: 'asc' as const },
        take: 10,
      },
    };
  }

  /**
   * Includes đầy đủ cho product detail page
   */
  private get fullIncludes() {
    return {
      ...this.defaultIncludes,
      skus: {
        where: { status: 'ACTIVE' },
        include: {
          optionValues: {
            include: { optionValue: true },
          },
          images: { take: 5 },
        },
      },
      options: {
        orderBy: { displayOrder: 'asc' as const },
        include: {
          values: {
            include: { image: true },
          },
        },
      },
    };
  }

  /**
   * Tìm products với filters phức tạp.
   * Đây là method chính cho product listing.
   */
  async findWithFilters(
    filter: ProductFilterOptions,
  ): Promise<PaginatedResult<ProductWithRelations>> {
    const whereConditions = this.buildWhereConditions(filter);
    const orderBy = this.buildOrderBy(filter.sortBy, filter.sortOrder);

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 12, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where: whereConditions,
        orderBy,
        include: this.defaultIncludes,
        skip,
        take: limit,
      }),
      this.model.count({ where: whereConditions }),
    ]);

    const lastPage = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Tìm product theo slug (cho SEO URLs)
   */
  async findBySlug(
    slug: string,
    includeSkus = true,
  ): Promise<ProductWithRelations | null> {
    return this.model.findFirst({
      where: this.withTenantFilter({
        slug,
        deletedAt: null,
      }),
      include: includeSkus ? this.fullIncludes : this.defaultIncludes,
    });
  }

  /**
   * Tìm products theo brand
   */
  async findByBrand(
    brandId: string,
    options?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Product>> {
    return this.findManyPaginated(
      {
        where: { brandId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: this.defaultIncludes,
      },
      options,
    );
  }

  /**
   * Tìm products theo categories
   */
  async findByCategories(
    categoryIds: string[],
    options?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Product>> {
    return this.findManyPaginated(
      {
        where: {
          deletedAt: null,
          categories: {
            some: {
              categoryId: { in: categoryIds },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: this.defaultIncludes,
      },
      options,
    );
  }

  /**
   * Tìm related products (cùng category, khác sản phẩm hiện tại)
   */
  async findRelated(productId: string, limit = 4): Promise<Product[]> {
    // Lấy categories của product hiện tại
    const product = await this.model.findFirst({
      where: this.withTenantFilter({ id: productId }),
      include: { categories: true },
    });

    if (!product || !product.categories.length) {
      return [];
    }

    const categoryIds = product.categories.map((c: any) => c.categoryId);

    return this.model.findMany({
      where: this.withTenantFilter({
        id: { not: productId },
        deletedAt: null,
        categories: {
          some: { categoryId: { in: categoryIds } },
        },
      }),
      include: this.defaultIncludes,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Full-text search products
   */
  async search(
    query: string,
    options?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Product>> {
    return this.findManyPaginated(
      {
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: this.defaultIncludes,
      },
      options,
    );
  }

  /**
   * Lấy products cho homepage (featured, best sellers, etc.)
   */
  async findFeatured(limit = 8): Promise<Product[]> {
    return this.model.findMany({
      where: this.withTenantFilter({
        deletedAt: null,
        // Có thể thêm flag isFeatured trong tương lai
      }),
      include: this.defaultIncludes,
      take: limit,
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
    });
  }

  /**
   * Update min/max prices cho product (denormalization)
   */
  async updatePriceRange(productId: string): Promise<Product> {
    const skuPrices = await this.prisma.sku.aggregate({
      where: { productId, status: 'ACTIVE' },
      _min: { price: true, salePrice: true },
      _max: { price: true, salePrice: true },
    });

    const minPrice = skuPrices._min.salePrice ?? skuPrices._min.price ?? 0;
    const maxPrice = skuPrices._max.price ?? 0;

    return this.model.update({
      where: { id: productId },
      data: { minPrice, maxPrice },
    });
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  /**
   * Build where conditions từ filter options
   */
  private buildWhereConditions(
    filter: ProductFilterOptions,
  ): Prisma.ProductWhereInput {
    const conditions: Prisma.ProductWhereInput = {
      ...this.withTenantFilter(),
      deletedAt: null,
    };

    // Search
    if (filter.search) {
      conditions.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Brand filter
    if (filter.brandId) {
      conditions.brandId = filter.brandId;
    }

    // Category filter
    if (filter.categoryIds?.length) {
      conditions.categories = {
        some: { categoryId: { in: filter.categoryIds } },
      };
    }

    // Price range
    if (filter.minPrice !== undefined) {
      conditions.minPrice = { gte: filter.minPrice };
    }
    if (filter.maxPrice !== undefined) {
      conditions.maxPrice = { lte: filter.maxPrice };
    }

    return conditions;
  }

  /**
   * Build orderBy clause
   */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.ProductOrderByWithRelationInput {
    const order = sortOrder || 'desc';

    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'minPrice':
        return { minPrice: order };
      case 'maxPrice':
        return { maxPrice: order };
      case 'avgRating':
        return { avgRating: order };
      case 'createdAt':
      default:
        return { createdAt: order };
    }
  }
}
