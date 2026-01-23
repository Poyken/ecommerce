/**
 * =====================================================================
 * PRISMA BRAND REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IBrandRepository,
  BrandQueryOptions,
} from '../../domain/repositories/brand.repository.interface';
import { Brand, BrandProps } from '../../domain/entities/brand.entity';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { Slug } from '@core/domain/value-objects/slug.vo';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class PrismaBrandRepository implements IBrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Brand | null> {
    const data = await (this.prisma.brand as any).findUnique({
      where: { id },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByIdOrFail(id: string): Promise<Brand> {
    const brand = await this.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand not found: ${id}`);
    }
    return brand;
  }

  async findBySlug(tenantId: string, slug: string): Promise<Brand | null> {
    const data = await (this.prisma.brand as any).findFirst({
      where: { tenantId, slug },
    });
    return data ? this.toDomain(data) : null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma.brand as any).count({ where: { id } });
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
    const count = await (this.prisma.brand as any).count({ where });
    return count === 0;
  }

  async findAll(
    tenantId: string,
    options?: BrandQueryOptions,
  ): Promise<PaginatedResult<Brand>> {
    const { page = 1, limit = 50, isActive, search } = options || {};
    const skip = calculateSkip(page, limit);

    const where: any = { tenantId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      (this.prisma.brand as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      (this.prisma.brand as any).count({ where }),
    ]);

    const brands = data.map((d: any) => this.toDomain(d));
    return createPaginatedResult(brands, total, page, limit);
  }

  async findActive(tenantId: string): Promise<Brand[]> {
    const data = await (this.prisma.brand as any).findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return data.map((d: any) => this.toDomain(d));
  }

  async countByTenant(tenantId: string): Promise<number> {
    return (this.prisma.brand as any).count({ where: { tenantId } });
  }

  async save(brand: Brand): Promise<Brand> {
    const data = brand.toPersistence();
    const tenant = getTenant();

    const existing = await (this.prisma.brand as any).findUnique({
      where: { id: brand.id },
    });

    let saved;
    if (existing) {
      saved = await (this.prisma.brand as any).update({
        where: { id: brand.id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          imageUrl: data.imageUrl,
          website: data.website,
          isActive: data.isActive,
          metadata: data.metadata as any,
          updatedAt: new Date(),
        },
      });
    } else {
      saved = await (this.prisma.brand as any).create({
        data: {
          id: data.id,
          tenantId: tenant?.id || data.tenantId,
          name: data.name,
          slug: data.slug,
          description: data.description,
          imageUrl: data.imageUrl,
          website: data.website,
          isActive: true,
          metadata: data.metadata as any,
        } as any,
      });
    }

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.brand as any).delete({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Brand[]> {
    if (ids.length === 0) return [];

    const data = await (this.prisma.brand as any).findMany({
      where: { id: { in: ids } },
    });

    return data.map((d: any) => this.toDomain(d));
  }

  // =====================================================================
  // MAPPER
  // =====================================================================

  private toDomain(data: any): Brand {
    const props: BrandProps = {
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      slug: Slug.create(data.slug),
      description: data.description,
      imageUrl: data.imageUrl,
      website: data.website,
      isActive: data.isActive,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return Brand.fromPersistence(props);
  }
}
