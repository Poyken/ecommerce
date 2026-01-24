/**
 * =====================================================================
 * PRISMA CATEGORY REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  ICategoryRepository,
  CategoryQueryOptions,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { getTenant } from '@core/tenant/tenant.context';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get includeCount() {
    return {
      _count: {
        select: { products: true },
      },
    };
  }

  async findById(id: string): Promise<Category | null> {
    const data = await (this.prisma.category as any).findUnique({
      where: { id },
      include: this.includeCount,
    });
    return data ? CategoryMapper.toDomain(data) : null;
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Category not found: ${id}`);
    }
    return category;
  }

  async findBySlug(tenantId: string, slug: string): Promise<Category | null> {
    const data = await (this.prisma.category as any).findFirst({
      where: { tenantId, slug },
      include: this.includeCount,
    });
    return data ? CategoryMapper.toDomain(data) : null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma.category as any).count({ where: { id } });
    return count > 0;
  }

  async isSlugUnique(
    tenantId: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { tenantId, slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await (this.prisma.category as any).count({ where });
    return count === 0;
  }

  async findAll(
    tenantId: string,
    options?: CategoryQueryOptions,
  ): Promise<PaginatedResult<Category>> {
    const { page = 1, limit = 50, parentId, search } = options || {};
    const skip = calculateSkip(page, limit);

    const where: any = { tenantId };

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    // isActive removed as it doesn't exist in schema

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      (this.prisma.category as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ name: 'asc' }], // Removed displayOrder
        include: this.includeCount,
      }),
      (this.prisma.category as any).count({ where }),
    ]);

    const categories = CategoryMapper.toDomainList(data);
    return createPaginatedResult(categories, total, page, limit);
  }

  async findRoots(tenantId: string): Promise<Category[]> {
    const data = await (this.prisma.category as any).findMany({
      where: { tenantId, parentId: null }, // Removed isActive
      orderBy: [{ name: 'asc' }],
      include: this.includeCount,
    });
    return CategoryMapper.toDomainList(data);
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const data = await (this.prisma.category as any).findMany({
      where: { parentId }, // Removed isActive
      orderBy: [{ name: 'asc' }],
      include: this.includeCount,
    });
    return CategoryMapper.toDomainList(data);
  }

  async findTree(tenantId: string): Promise<Category[]> {
    const data = await (this.prisma.category as any).findMany({
      where: { tenantId }, // Removed isActive
      orderBy: [{ name: 'asc' }],
      include: this.includeCount,
    });
    return CategoryMapper.toDomainList(data);
  }

  async findAncestors(categoryId: string): Promise<Category[]> {
    const ancestors: Category[] = [];
    let current = await this.findById(categoryId);

    while (current && current.parentId) {
      const parent = await this.findById(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return (this.prisma.category as any).count({ where: { tenantId } });
  }

  async save(category: Category): Promise<Category> {
    const data = CategoryMapper.toPersistence(category);
    const tenant = getTenant();

    const existing = await (this.prisma.category as any).findUnique({
      where: { id: category.id },
    });

    let saved;
    if (existing) {
      saved = await (this.prisma.category as any).update({
        where: { id: category.id },
        data: {
          name: data.name,
          slug: data.slug,
          // description: data.description, // Removed
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          // displayOrder: data.displayOrder, // Removed
          // isActive: data.isActive, // Removed
          // metadata: data.metadata as any, // Removed
          updatedAt: new Date(),
        },
        include: this.includeCount,
      });
    } else {
      saved = await (this.prisma.category as any).create({
        data: {
          id: data.id,
          tenantId: tenant?.id || data.tenantId,
          name: data.name,
          slug: data.slug,
          // description: data.description,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          // displayOrder: data.displayOrder || 0,
          // isActive: true,
          // metadata: data.metadata as any,
        } as any,
        include: this.includeCount,
      });
    }

    return CategoryMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.category as any).delete({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return [];

    const data = await (this.prisma.category as any).findMany({
      where: { id: { in: ids } },
      include: this.includeCount,
    });

    return CategoryMapper.toDomainList(data);
  }
}
