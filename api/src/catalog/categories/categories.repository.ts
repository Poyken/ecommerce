import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  PaginatedResult,
} from '@core/repository/base.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';

/**
 * =====================================================================
 * CATEGORIES REPOSITORY - TRUY CẬP DỮ LIỆU DANH MỤC
 * =====================================================================
 */

export type CategoryWithChildren = Prisma.CategoryGetPayload<{
  include: {
    children: true;
    _count: { select: { products: true } };
  };
}>;

export interface CategoryTree extends Category {
  children: CategoryTree[];
  productCount: number;
}

@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
  protected readonly modelName = 'category';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Lấy danh sách categories dạng flat (cho admin)
   */
  async findAllFlat(): Promise<Category[]> {
    return this.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Lấy danh sách categories dạng tree (cho navigation)
   */
  async findAsTree(): Promise<CategoryTree[]> {
    const categories = await this.model.findMany({
      where: this.withTenantFilter({ parentId: null, deletedAt: null }),
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            children: { where: { deletedAt: null } },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((cat: any) => this.mapToTree(cat));
  }

  /**
   * Tìm category theo slug
   */
  async findBySlug(slug: string): Promise<Category | null> {
    return this.model.findFirst({
      where: this.withTenantFilter({ slug, deletedAt: null }),
      include: {
        children: { where: { deletedAt: null } },
        parent: true,
      },
    });
  }

  /**
   * Lấy breadcrumb cho một category
   */
  async getBreadcrumb(categoryId: string): Promise<Category[]> {
    const breadcrumb: Category[] = [];
    let current = await this.findById(categoryId);

    while (current) {
      breadcrumb.unshift(current);
      if (current.parentId) {
        current = await this.findById(current.parentId);
      } else {
        break;
      }
    }

    return breadcrumb;
  }

  /**
   * Lấy tất cả category IDs con (recursive)
   */
  async getAllChildIds(categoryId: string): Promise<string[]> {
    const result: string[] = [categoryId];

    const children = await this.model.findMany({
      where: this.withTenantFilter({ parentId: categoryId, deletedAt: null }),
      select: { id: true },
    });

    for (const child of children) {
      const childIds = await this.getAllChildIds(child.id);
      result.push(...childIds);
    }

    return result;
  }

  private mapToTree(category: any): CategoryTree {
    return {
      ...category,
      productCount: category._count?.products || 0,
      children: (category.children || []).map((c: any) => this.mapToTree(c)),
    };
  }
}
