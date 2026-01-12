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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKU CODE (Mã định danh):
 * - `skuCode` là mã duy nhất để phân biệt các mặt hàng trong kho.
 * - Hệ thống bắt buộc mã này phải là duy nhất (`ConflictException`) để tránh nhầm lẫn khi nhập/xuất kho.
 *
 * 2. OPTION VALUES MAPPING:
 * - Một SKU được định nghĩa bởi sự kết hợp của nhiều Option Value (VD: Màu Đỏ + Size L).
 * - Ta sử dụng bảng trung gian `SkuToOptionValue` để lưu trữ mối quan hệ Many-to-Many này.
 *
 * 3. INVENTORY MONITORING (Giám sát tồn kho):
 * - Hàm `findAll` hỗ trợ lọc theo `stockLimit`. Giúp Admin dễ dàng tìm ra các mặt hàng sắp hết hàng để kịp thời nhập thêm.
 *
 * 4. SEARCHING:
 * - Hỗ trợ tìm kiếm theo cả mã SKU và tên sản phẩm gốc, giúp việc quản lý trở nên linh hoạt và nhanh chóng.
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
          })),
        },
      },
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
    const skip = (page - 1) * limit;
    const where: any = {};

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
    const deletedSku = await this.prisma.sku.delete({ where: { id } });

    // Update Product Price Cache
    await this.skuManager.updateProductPriceRange(deletedSku.productId);

    return deletedSku;
  }
}
