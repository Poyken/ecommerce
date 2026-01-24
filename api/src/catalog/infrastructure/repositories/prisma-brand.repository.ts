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
import { Brand } from '../../domain/entities/brand.entity';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { getTenant } from '@core/tenant/tenant.context';
import { BrandMapper } from '../mappers/brand.mapper';

@Injectable()
export class PrismaBrandRepository implements IBrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Brand | null> {
    const data = await (this.prisma.brand as any).findUnique({
      where: { id },
    });
    return data ? BrandMapper.toDomain(data) : null;
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
    return data ? BrandMapper.toDomain(data) : null;
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
    const { page = 1, limit = 50, search } = options || {};
    const skip = calculateSkip(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      (this.prisma.brand as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ name: 'asc' }],
      }),
      (this.prisma.brand as any).count({ where }),
    ]);

    const brands = BrandMapper.toDomainList(data);
    return createPaginatedResult(brands, total, page, limit);
  }

  async countByTenant(tenantId: string): Promise<number> {
    return (this.prisma.brand as any).count({ where: { tenantId } });
  }

  async save(brand: Brand): Promise<Brand> {
    const data = BrandMapper.toPersistence(brand);
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
          imageUrl: data.imageUrl,
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
          imageUrl: data.imageUrl,
        } as any,
      });
    }

    return BrandMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.brand as any).delete({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Brand[]> {
    if (ids.length === 0) return [];

    const data = await (this.prisma.brand as any).findMany({
      where: { id: { in: ids } },
    });

    return BrandMapper.toDomainList(data);
  }
}
