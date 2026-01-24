/**
 * =====================================================================
 * PRISMA SKU REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  ISkuRepository,
  SkuQueryOptions,
  StockUpdate,
} from '../../domain/repositories/sku.repository.interface';
import { Sku, SkuStatus } from '../../domain/entities/sku.entity';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { getTenant } from '@core/tenant/tenant.context';
import { SkuMapper } from '../mappers/sku.mapper';

@Injectable()
export class PrismaSkuRepository implements ISkuRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get includeRelations() {
    return {
      images: true,
      optionValues: {
        include: {
          optionValue: {
            include: {
              option: true,
            },
          },
        },
      },
    };
  }

  async findById(id: string): Promise<Sku | null> {
    const data = await (this.prisma.sku as any).findUnique({
      where: { id },
      include: this.includeRelations,
    });
    return data ? SkuMapper.toDomain(data) : null;
  }

  async findByIdOrFail(id: string): Promise<Sku> {
    const sku = await this.findById(id);
    if (!sku) {
      throw new NotFoundException(`SKU not found: ${id}`);
    }
    return sku;
  }

  async findByCode(tenantId: string, skuCode: string): Promise<Sku | null> {
    const data = await (this.prisma.sku as any).findFirst({
      where: { tenantId, skuCode },
      include: this.includeRelations,
    });
    return data ? SkuMapper.toDomain(data) : null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma.sku as any).count({ where: { id } });
    return count > 0;
  }

  async isCodeUnique(
    tenantId: string,
    skuCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { tenantId, skuCode };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await (this.prisma.sku as any).count({ where });
    return count === 0;
  }

  async findByProduct(productId: string, status?: SkuStatus): Promise<Sku[]> {
    const where: any = { productId };
    if (status) {
      where.status = status;
    }
    const data = await (this.prisma.sku as any).findMany({
      where,
      include: this.includeRelations,
      orderBy: { skuCode: 'asc' },
    });
    return SkuMapper.toDomainList(data);
  }

  async findAll(
    tenantId: string,
    options?: SkuQueryOptions,
  ): Promise<PaginatedResult<Sku>> {
    const {
      page = 1,
      limit = 50,
      productId,
      status,
      inStock,
      search,
      stockLimit,
    } = options || {};
    const skip = calculateSkip(page, limit);

    const where: any = { tenantId };

    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (inStock) where.stock = { gt: 0 };
    if (search) {
      where.skuCode = { contains: search, mode: 'insensitive' };
    }
    if (stockLimit !== undefined) {
      where.stock = { lte: stockLimit };
    }

    const [data, total] = await Promise.all([
      (this.prisma.sku as any).findMany({
        where,
        skip,
        take: limit,
        include: this.includeRelations,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma.sku as any).count({ where }),
    ]);

    const skus = SkuMapper.toDomainList(data);
    return createPaginatedResult(skus, total, page, limit);
  }

  async findLowStock(tenantId: string, threshold: number): Promise<Sku[]> {
    const data = await (this.prisma.sku as any).findMany({
      where: {
        tenantId,
        stock: { lte: threshold },
        status: SkuStatus.ACTIVE,
      },
      include: this.includeRelations,
      orderBy: { stock: 'asc' },
    });
    return SkuMapper.toDomainList(data);
  }

  async countByProduct(productId: string): Promise<number> {
    return (this.prisma.sku as any).count({ where: { productId } });
  }

  async save(sku: Sku): Promise<Sku> {
    const data: any = SkuMapper.toPersistence(sku);
    const tenant = getTenant();

    const existing = await (this.prisma.sku as any).findUnique({
      where: { id: sku.id },
    });

    let saved;
    if (existing) {
      saved = await (this.prisma.sku as any).update({
        where: { id: sku.id },
        data: {
          skuCode: data.skuCode,
          price: data.price,
          salePrice: data.salePrice,
          stock: data.stock,
          reservedStock: data.reservedStock,
          status: data.status,
          imageUrl: data.imageUrl,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
        include: this.includeRelations,
      });
    } else {
      saved = await (this.prisma.sku as any).create({
        data: {
          ...data,
          tenantId: tenant?.id || data.tenantId,
        },
        include: this.includeRelations,
      });
    }

    return SkuMapper.toDomain(saved);
  }

  async saveMany(skus: Sku[]): Promise<Sku[]> {
    const results: Sku[] = [];
    for (const sku of skus) {
      results.push(await this.save(sku));
    }
    return results;
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.sku as any).delete({ where: { id } });
  }

  async deleteByProduct(productId: string): Promise<void> {
    await (this.prisma.sku as any).deleteMany({ where: { productId } });
  }

  async findByIds(ids: string[]): Promise<Sku[]> {
    if (ids.length === 0) return [];
    const data = await (this.prisma.sku as any).findMany({
      where: { id: { in: ids } },
      include: this.includeRelations,
    });
    return SkuMapper.toDomainList(data);
  }

  async updateStockBatch(updates: StockUpdate[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map((update) => {
        const data: any = {};
        if (update.operation === 'set') data.stock = update.quantity;
        if (update.operation === 'add')
          data.stock = { increment: update.quantity };
        if (update.operation === 'remove')
          data.stock = { decrement: update.quantity };

        return (this.prisma.sku as any).update({
          where: { id: update.skuId },
          data,
        });
      }),
    );
  }

  async reserveStock(skuId: string, quantity: number): Promise<void> {
    await (this.prisma.sku as any).update({
      where: { id: skuId },
      data: {
        reservedStock: { increment: quantity },
      },
    });
  }

  async releaseStock(skuId: string, quantity: number): Promise<void> {
    await (this.prisma.sku as any).update({
      where: { id: skuId },
      data: {
        reservedStock: { decrement: quantity },
      },
    });
  }
}
