import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@core/repository/base.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import { Brand } from '@prisma/client';

/**
 * =====================================================================
 * BRANDS REPOSITORY - TRUY CẬP DỮ LIỆU THƯƠNG HIỆU
 * =====================================================================
 */

@Injectable()
export class BrandsRepository extends BaseRepository<Brand> {
  protected readonly modelName = 'brand';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Lấy tất cả brands với số lượng sản phẩm
   */
  async findAllWithProductCount(): Promise<
    (Brand & { productCount: number })[]
  > {
    const brands = await this.model.findMany({
      where: this.withTenantFilter({ deletedAt: null }),
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return brands.map((b: any) => ({
      ...b,
      productCount: b._count.products,
    }));
  }

  /**
   * Tìm brand theo slug
   */
  async findBySlug(slug: string): Promise<Brand | null> {
    return this.model.findFirst({
      where: this.withTenantFilter({ slug, deletedAt: null }),
    });
  }

  /**
   * Lấy top brands theo số lượng sản phẩm
   */
  async findTopBrands(limit = 10): Promise<Brand[]> {
    const brands = await this.model.findMany({
      where: this.withTenantFilter({ deletedAt: null }),
      include: {
        _count: { select: { products: true } },
      },
      orderBy: {
        products: { _count: 'desc' },
      },
      take: limit,
    });

    return brands;
  }
}
