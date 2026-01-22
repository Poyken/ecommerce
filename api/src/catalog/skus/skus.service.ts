import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

/**
 * =====================================================================
 * SKUS SERVICE - Dịch vụ quản lý biến thể và tồn kho
 * =====================================================================
 *
 * =====================================================================
 */

import { SkuManagerService } from '@/catalog/products/sku-manager.service';

@Injectable()
export class SkusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skuManager: SkuManagerService,
  ) {}

  async create(createSkuDto: CreateSkuDto) {
    const { optionValueIds, imageUrl, ...skuData } = createSkuDto;

    const tenant = getTenant();
    const existing = await this.prisma.sku.findFirst({
      where: {
        skuCode: skuData.skuCode,
        tenantId: tenant?.id,
      },
    });
    if (existing) {
      throw new ConflictException('Mã SKU này đã tồn tại');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: skuData.productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm gốc không tồn tại');
    }

    const newSku = await this.prisma.sku.create({
      data: {
        ...skuData,
        imageUrl,
        tenantId: tenant!.id,
        optionValues: {
          create: optionValueIds.map((valId) => ({
            optionValueId: valId,
            tenantId: tenant!.id,
          })),
        },
      } as any,
      include: {
        optionValues: { include: { optionValue: true } },
      },
    });

    // Update Product Price Cache
    await this.skuManager.updateProductPriceRange(newSku.productId);

    return newSku;
  }

  async findAll(
    page: number,
    limit: number,
    status?: string,
    search?: string,
    stockLimit?: number,
  ) {
    const tenant = getTenant();
    const skip = (page - 1) * limit;
    const where: any = { tenantId: tenant?.id };

    if (status) {
      where.status = status;
    }

    if (stockLimit !== undefined) {
      where.stock = { lte: stockLimit };
    }

    if (search) {
      where.OR = [
        { skuCode: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [skus, total] = await Promise.all([
      this.prisma.sku.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { name: true } },
          optionValues: { include: { optionValue: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sku.count({ where }),
    ]);

    return {
      data: skus,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = getTenant();
    const sku = await this.prisma.sku.findFirst({
      where: {
        id,
        tenantId: tenant?.id,
      },
      include: {
        product: true,
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
    if (!sku) throw new NotFoundException('Không tìm thấy SKU');
    return sku;
  }

  async update(id: string, updateSkuDto: UpdateSkuDto) {
    const { imageUrl, ...data } = updateSkuDto;

    const updatedSku = await this.prisma.sku.update({
      where: { id },
      data: {
        ...data,
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    // Update Product Price Cache
    await this.skuManager.updateProductPriceRange(updatedSku.productId);

    return updatedSku;
  }

  async remove(id: string) {
    const deletedSku = await this.prisma.sku.delete({
      where: { id },
    });

    // Update Product Price Cache
    await this.skuManager.updateProductPriceRange(deletedSku.productId);

    return deletedSku;
  }
}
