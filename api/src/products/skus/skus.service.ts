import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@Injectable()
export class SkusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo SKU (Stock Keeping Unit) - Biến thể bán hàng.
   * Đây là thực thể "có thật" trong kho, có giá và số lượng cụ thể.
   * Ví dụ: iPhone 15 PM - Xanh - 256GB -> Giá 30tr, Tồn kho 10.
   */
  async create(createSkuDto: CreateSkuDto) {
    const { optionValueIds, ...skuData } = createSkuDto;

    // 1. Kiểm tra mã SKU (phải duy nhất toàn hệ thống)
    const existing = await this.prisma.sku.findUnique({
      where: { skuCode: skuData.skuCode },
    });
    if (existing) {
      throw new ConflictException('Mã SKU này đã tồn tại');
    }

    // 2. Validate Product gốc
    const product = await this.prisma.product.findUnique({
      where: { id: skuData.productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm gốc không tồn tại');
    }

    // 3. Tạo SKU và liên kết với các Option Values
    // optionValueIds là mảng các ID của (Màu: Đỏ, Size: L, ...)
    return this.prisma.sku.create({
      data: {
        ...skuData,
        // Liên kết many-to-many thông qua bảng trung gian SkuToOptionValue
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
  }

  async findAll(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const sku = await this.prisma.sku.findUnique({
      where: { id },
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
    const { optionValueIds, ...data } = updateSkuDto;

    // Update thông tin cơ bản: Giá, Tồn kho...
    const updatedSku = await this.prisma.sku.update({
      where: { id },
      data: data,
    });

    return updatedSku;
  }

  async remove(id: string) {
    return this.prisma.sku.delete({ where: { id } });
  }
}
